// processSongs.mjs
import fs from 'fs'
import * as mm from 'music-metadata'
import NodeID3 from 'node-id3'
import path from 'path'

async function processSong(filePath) {
	console.log(`Reading metadata from: ${filePath}`)
	try {
		const metadata = await mm.parseFile(filePath)

		if (!metadata.common.artist) {
			console.log(`No artist metadata found for: ${filePath}`)
			return
		}

		const artists = metadata.common.artist.split(',')
		const uniqueArtists = [...new Set(artists.map(artist => artist.trim()))]

		// Read current tags using node-id3
		const currentTags = NodeID3.read(filePath)

		// Only update the artist field
		currentTags.artist = uniqueArtists.join(', ')

		console.log(`Updating metadata for: ${filePath}`)
		NodeID3.write(currentTags, filePath)
		console.log(`Processed: ${filePath}`)
	} catch (error) {
		console.error(`Error processing ${filePath}: ${error.message}`)
	}
}

async function scanDirectory(directoryPath) {
	console.log(`Scanning directory: ${directoryPath}`)
	const files = fs.readdirSync(directoryPath)

	for (let file of files) {
		const filePath = path.join(directoryPath, file)
		const stat = fs.statSync(filePath)

		if (stat.isDirectory()) {
			console.log(`Found sub-directory: ${filePath}`)
			await scanDirectory(filePath) // Recurse into sub-directories
		} else if (path.extname(filePath) === '.mp3') {
			await processSong(filePath)
		} else {
			console.log(`Skipping non-mp3 file: ${filePath}`)
		}
	}
}

// Hardcoded directory
const directoryPath = '/Users/yhafez/Desktop/Songs to adjust'

scanDirectory(directoryPath)
	.then(() => console.log('Processing complete.'))
	.catch(error => console.error(`Error: ${error.message}`))
