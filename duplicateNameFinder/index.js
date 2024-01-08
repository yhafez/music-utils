import { createObjectCsvWriter as createCsvWriter } from 'csv-writer'
import { readdirSync } from 'fs'
import * as musicMetadata from 'music-metadata'
import similarity from 'string-similarity'

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
				trackMetadataList.push({
					filename: file,
					title: metadata.common.title.toLowerCase(),
					artist: metadata.common.artist,
				})
			}
		}
	}

	console.log('Step 3: Identifying duplicate tracks')
	const titleToArtistsMap = {}
	const titlesToSkip = ['intro', 'outro', 'unknown'] // Add the track titles to skip here

	trackMetadataList.forEach(track => {
		if (!titleToArtistsMap[track.title] && !titlesToSkip.includes(track.title)) {
			titleToArtistsMap[track.title] = []
		}
		titleToArtistsMap[track.title]?.push(track.artist)
	})

	const duplicates = []
	for (const [title, artists] of Object.entries(titleToArtistsMap)) {
		if (artists.length > 1) {
			const groups = []
			while (artists.length) {
				const [currentArtist] = artists.splice(0, 1)
				const group = [currentArtist]
				for (let i = artists.length - 1; i >= 0; i--) {
					if (similarity.compareTwoStrings(currentArtist, artists[i]) > 0.25) {
						group.push(...artists.splice(i, 1))
					}
				}
				groups.push(group)
			}
			const filteredGroups = groups.filter(group => group.length > 1)
			if (filteredGroups.length) {
				duplicates.push(...filteredGroups.map(group => ({ title, artists: group.join(' | ') })))
			}
		}
	}

	console.log('Step 4: Writing duplicate tracks to CSV file')
	const csvWriter = createCsvWriter({
		path: 'duplicate_tracks.csv',
		header: [
			{ id: 'title', title: 'TITLE' },
			{ id: 'artists', title: 'ARTISTS' },
		],
	})
	await csvWriter.writeRecords(duplicates)

	console.log('Done. The list of duplicate tracks has been written to "duplicate_tracks.csv".')
}

const dirPath = '/Volumes/DJ 2/Music'
getDuplicateTracks(dirPath)
