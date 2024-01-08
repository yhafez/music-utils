import { createObjectCsvWriter as createCsvWriter } from 'csv-writer'
import { readdirSync, statSync } from 'fs'
import * as musicMetadata from 'music-metadata'
import similarity from 'string-similarity'
import trash from 'trash'

async function getDuplicateTracks(dirPath) {
	console.log('Step 1: Reading directory')
	const files = readdirSync(dirPath)

	console.log('Step 2: Reading metadata of files')
	const trackMetadataList = []
	for (let file of files) {
		if (file.endsWith('.mp3')) {
			console.log(`Scanning: ${file}`)
			const metadata = await musicMetadata.parseFile(`${dirPath}/${file}`)
			if (metadata.common.title && metadata.common.artist) {
				const stats = statSync(`${dirPath}/${file}`)
				trackMetadataList.push({
					filename: file,
					title: metadata.common.title.toLowerCase(),
					artist: metadata.common.artist,
					size: stats.size,
				})
			}
		}
	}

	console.log('Step 3: Identifying duplicate tracks based on title and artist similarity')
	const duplicates = []
	const trackTitlesToSkip = ['bounce', 'fire', 'higher', 'lasers', 'love me', 'concentrate', 'say it'] // Add titles to skip here

	trackMetadataList.forEach((track1, index) => {
		for (let i = index + 1; i < trackMetadataList.length; i++) {
			const track2 = trackMetadataList[i]
			if (track1.title === track2.title && !trackTitlesToSkip.includes(track1.title)) {
				const similarityScore = similarity.compareTwoStrings(track1.artist, track2.artist)
				if (similarityScore > 0.3) {
					// Adjust threshold as needed
					const existingDuplicate = duplicates.find(dup => dup.title === track1.title)
					if (existingDuplicate) {
						existingDuplicate.artists.add(track1.artist)
						existingDuplicate.artists.add(track2.artist)
					} else {
						duplicates.push({
							title: track1.title,
							artists: new Set([
								track1.artist,
								track2.artist,
							]),
						})
					}
				}
			}
		}
	})

	const tracksMovedToBin = []
	console.log('Step 4: Moving duplicate files to the recycle bin')
	for (const duplicate of duplicates) {
		const { title, artists } = duplicate
		const artistArr = Array.from(artists)
		const tracks = trackMetadataList.filter(track => track.title === title && artistArr.includes(track.artist))
		if (tracks.length > 1) {
			tracks.sort((a, b) => {
				const commaCountA = (a.artist.match(/,/g) || []).length
				const commaCountB = (b.artist.match(/,/g) || []).length

				if (commaCountA > commaCountB) return -1
				if (commaCountA < commaCountB) return 1

				if (a.artist.includes('&') && !b.artist.includes('&')) {
					return -1
				}
				if (!a.artist.includes('&') && b.artist.includes('&')) {
					return 1
				}
				return b.size - a.size
			})
			const filesToDelete = tracks.slice(1).map(track => `${dirPath}/${track.filename}`)
			tracks.slice(1).forEach(track => tracksMovedToBin.push({ title: track.title, artist: track.artist }))
			await trash(filesToDelete)
		}
	}

	console.log('Step 5: Writing duplicate tracks and tracks moved to bin to CSV files')

	// Existing CSV Writer for duplicate tracks
	const csvWriter = createCsvWriter({
		path: 'duplicate_tracks.csv',
		header: [
			{ id: 'title', title: 'TITLE' },
			{ id: 'artists', title: 'ARTISTS' },
		],
	})
	await csvWriter.writeRecords(duplicates.map(dup => ({ title: dup.title, artists: Array.from(dup.artists).join(' | ') })))

	// New CSV Writer for tracks moved to the recycle bin
	const csvWriterBin = createCsvWriter({
		path: 'tracks_moved_to_bin.csv',
		header: [
			{ id: 'title', title: 'TITLE' },
			{ id: 'artist', title: 'ARTIST' },
		],
	})
	await csvWriterBin.writeRecords(tracksMovedToBin.map(track => ({ title: track.title, artist: track.artist })))

	console.log('Done. The list of duplicate tracks and tracks moved to bin have been written to "duplicate_tracks.csv" and "tracks_moved_to_bin.csv" respectively.')
}

const dirPath = '/Volumes/DJ 2/Music'
getDuplicateTracks(dirPath)
