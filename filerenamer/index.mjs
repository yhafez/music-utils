import fs from 'fs'
import path from 'path'
import * as mm from 'music-metadata'
import nodeID3 from 'node-id3'

async function updateMetadata(filePath) {
	console.log(`Processing file: ${filePath}`)

	try {
		const metadata = await mm.parseFile(filePath)
		console.log(`Extracted metadata from ${filePath}`)

		if (metadata && metadata.common && metadata.common.title) {
			let newTitle = metadata.common.title
			let newArtist = metadata.common.artist || ''
			let changeDetected = false

			// Check for featured artist pattern
			const featMatch = newTitle.match(/\((feat\.?|ft\.?)\s*(.*?)\)/i)
			if (featMatch) {
				const featuredArtist = featMatch[2]
				console.log(`Found featured artist "${featuredArtist}" in "${newTitle}"`)
				newTitle = newTitle.replace(/\s*\((feat\.?|ft\.?)\s*(.*?)\)\s*/i, ' ').trim()

				if (!new RegExp(`\\b${featuredArtist}\\b`, 'i').test(newArtist)) {
					newArtist += `, ${featuredArtist}`
					changeDetected = true
				} else {
					console.log(
						`Artist "${newArtist}" already contains featured artist "${featuredArtist}". No updates made to artist.`,
					)
				}
			}

			// Check for remix/edit/mix/bootleg pattern
			const remixMatch = newTitle.match(/\((.*?)(remix|mix|bootleg|edit)\)/i)
			if (remixMatch) {
				const remixerName = remixMatch[1].trim()
				console.log(`Found remixer "${remixerName}" in "${newTitle}"`)

				if (!new RegExp(`\\b${remixerName}\\b`, 'i').test(newArtist)) {
					newArtist += `, ${remixerName}`
					changeDetected = true
				} else {
					console.log(
						`Artist "${newArtist}" already contains remixer "${remixerName}". No updates made to artist.`,
					)
				}
			}

			// Only write changes if detected
			if (changeDetected) {
				// Create tags object for nodeID3
				const tags = {
					title: newTitle,
					artist: newArtist,
				}

				// Write the updated metadata back to the MP3 file using nodeID3
				const success = nodeID3.write(tags, filePath)
				if (success) {
					console.log(`Successfully updated metadata for "${filePath}"`)
				} else {
					console.error(`Failed to update metadata for "${filePath}"`)
				}
			} else {
				console.log(`No changes detected for "${filePath}". Skipping...`)
			}
		} else {
			console.log(`No title metadata found for "${filePath}". Skipping...`)
		}
	} catch (error) {
		console.error(`Error processing file "${filePath}": ${error.message}`)
	}
}

function processDirectory(directory) {
	fs.readdir(directory, (err, files) => {
		if (err) {
			console.error(`Error reading directory "${directory}": ${err.message}`)
			return
		}

		for (const file of files) {
			const filePath = path.join(directory, file)

			// Check if it's a subdirectory
			if (fs.statSync(filePath).isDirectory()) {
				processDirectory(filePath)
			} else if (path.extname(filePath) === '.mp3') {
				updateMetadata(filePath)
			}
		}
	})
}

const directoryPath = '/Users/yhafez/Desktop/Songs to adjust'
processDirectory(directoryPath)
