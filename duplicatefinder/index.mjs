import fs from 'fs'
import path from 'path'

const SONGS_DIRECTORY = '/Users/yhafez/Desktop/Songs to adjust'

// Check if the MP3 uses ID3v2 tags
function usesID3v2(buffer) {
	return buffer.slice(0, 3).toString() === 'ID3'
}

// Extract the title and artist from the ID3v2 tag
function extractMetadata(buffer) {
	if (!usesID3v2(buffer)) {
		return null
	}

	const size = buffer.readInt32BE(6) // Read the tag size
	const tagContent = buffer.slice(10, 10 + size)

	let title = null
	let artist = null

	const titleMatch = tagContent.toString().match(/TIT2(.+?)\0/)
	const artistMatch = tagContent.toString().match(/TPE1(.+?)\0/)

	if (titleMatch) {
		title = titleMatch[1].trim()
	}

	if (artistMatch) {
		artist = artistMatch[1].trim()
	}

	return { title, artist }
}

function updateMetadata(filePath) {
	console.log(`Processing file: ${filePath}`)
	const buffer = fs.readFileSync(filePath)

	if (!usesID3v2(buffer)) {
		console.log(`File "${filePath}" does not use ID3v2 tags. Skipping...`)
		return
	}
	console.log(`Extracting metadata from ${filePath}`)
	const metadata = extractMetadata(buffer)

	if (metadata && metadata.title) {
		console.log(`Inspecting title: "${metadata.title}" for feature artist patterns`)
		const match = metadata.title.match(/\(ft\. (.*?)\)/)
		if (match) {
			const featuredArtist = match[1]
			console.log(`Found featured artist "${featuredArtist}" in "${metadata.title}"`)

			metadata.title = metadata.title.replace(match[0], '').trim()
			console.log(`Updated title to: "${metadata.title}"`)

			if (metadata.artist) {
				metadata.artist += `, ${featuredArtist}`
			} else {
				metadata.artist = featuredArtist
			}
			console.log(`Updated artist to: "${metadata.artist}"`)

			const titlePosition = buffer.indexOf('TIT2') + 5
			const artistPosition = buffer.indexOf('TPE1') + 5

			buffer.write(metadata.title, titlePosition, 'utf-8')
			buffer.write(metadata.artist, artistPosition, 'utf-8')

			fs.writeFileSync(filePath, buffer)
			console.log(`Wrote updated metadata back to "${filePath}"`)
		} else {
			console.log(`No featured artist pattern found in "${metadata.title}". Skipping...`)
		}
	} else {
		console.log(`No title metadata found for "${filePath}". Skipping...`)
	}
}

console.log(`Starting to process MP3 files in "${SONGS_DIRECTORY}"`)
fs.readdir(SONGS_DIRECTORY, (err, files) => {
	if (err) {
		console.error(`Error reading directory: ${err.message}`)
		return
	}

	files.forEach(file => {
		const filePath = path.join(SONGS_DIRECTORY, file)
		if (filePath.endsWith('.mp3')) {
			updateMetadata(filePath)
		} else {
			console.log(`Skipping non-MP3 file "${file}"`)
		}
	})
})
