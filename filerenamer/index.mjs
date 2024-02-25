import fs from 'fs'
import path from 'path'
import * as mm from 'music-metadata'
import nodeID3 from 'node-id3'
;('The Lonely Players Club) (gnash, 4e')

const joinWithCommaList = [' - ', ' -', ' x ', ' X ', ' & ', ' vs ', ' vs. ', ' Vs ', ' Vs. ', ' VS ', ' VS. ', ' and ', ' And ', ' AND']

const remixerSuffixList = [
	'Mix Cut) (Miami',
	' Reggaeton',
	' Socacore',
	' Like This',
	' Post Mungo',
	'Mixed) (',
	"It's Gonna Kill Me) (",
	' Trigger Happy',
	' Tell Me',
	' I Said It Again',
	' Hype Or Die Re',
	' PSY',
	' RMX / Short',
	' Fuck Bitch Promoters',
	' Rearranged',
	" 'Long Time'",
	' Re-',
	' RetroFuture',
	' Tokyo',
	" 'Devotion'",
	' Reggae Chop',
	' Torro Torro Surprise',
	' Rebirth',
	' Live',
	'Day, Night',
	" 'Stick It In Reverse'",
	" 'Bel Mercy'",
	' Baile Funk',
	' Turnpike',
	' XMAS',
	' Jump Off',
	" 'BAM BAM'",
	' Moombah',
	' YZY',
	' Hard',
	' Halloween',
	' Short',
	' Bass House',
	' House',
	'House',
	'VIP Trap',
	' Barricade',
	' Jersey Terror',
	' Big Room',
	' HYPERTECHNO',
	' jersey club',
	' Jersey Club',
	' jersey Club',
	' Jersey club',
	' JERSEY CLUB',
	'jersey club',
	'Jersey Club',
	'jersey Club',
	'Jersey club',
	'JERSEY CLUB',
	' twerk',
	' Twerk',
	' TWERK',
	'twerk',
	'Twerk',
	'TWERK',
	' Club',
	' club',
	' CLUB',
	'Club',
	'club',
	'CLUB',
	' jersey',
	' Jersey',
	' JERSEY',
	'jersey',
	'Jersey',
	'JERSEY',
	' dnb',
	' DnB',
	' Dnb',
	' DNB',
	'dnb',
	'DnB',
	'Dnb',
	'DNB',
	' trap',
	' Trap',
	' TRAP',
	'trap',
	'Trap',
	'TRAP',
	' inst',
	' inst.',
	' Inst',
	' Inst.',
	' INST',
	' INST.',
	'inst',
	'inst.',
	'Inst',
	'Inst.',
	'INST',
	'INST.',
	' vocal',
	' Vocal',
	' VOCAL',
	'vocal',
	'Vocal',
	'VOCAL',
	' edit ',
	' Edit ',
	' EDIT ',
	' edit',
	' Edit',
	' EDIT',
	'edit',
	'Edit',
	'EDIT',
	' remix ',
	' Remix ',
	' REMIX ',
	' remix',
	' Remix',
	' REMIX',
	'remix',
	'Remix',
	'REMIX',
	' mix ',
	' Mix ',
	' MIX ',
	' mix',
	' Mix',
	' MIX',
	'mix',
	'Mix',
	'MIX',
	' bootleg ',
	' Bootleg ',
	' BOOTLEG ',
	' bootleg',
	' Bootleg',
	' BOOTLEG',
	'bootleg',
	'Bootleg',
	'BOOTLEG',
	' vip ',
	' Vip ',
	' VIP ',
	' vip',
	' Vip',
	' VIP',
	'vip',
	'Vip',
	'VIP',
	' flip ',
	' Flip ',
	' FLIP ',
	' flip',
	' Flip',
	' FLIP',
	'flip',
	'Flip',
	'FLIP',
	' vip ',
	' Vip ',
	' VIP ',
	' v.i.p. ',
	' V.i.p. ',
	' V.I.P. ',
	' v.i.p ',
	' V.i.p ',
	' V.I.P ',
	' vip',
	' Vip',
	' VIP',
	' v.i.p.',
	' V.i.p.',
	' V.I.P.',
	' v.i.p',
	' V.i.p',
	' V.I.P',
	'vip',
	'Vip',
	'VIP',
	'v.i.p.',
	'V.i.p.',
	'V.I.P.',
	'v.i.p',
	'V.i.p',
	'V.I.P',
	"'s",
]

const skipList = [
	'Club Breakerz',
	'FlipNGawd',
	"FlipN'Gawd",
	'Gentlemens Club',
	'FlipstiK',
	'Dommix',
	'Dodge&Fuski',
	'Dodge & Fuski',
	'Blunts & Blondes',
	'Blunts&Blondes',
	'Brown&Gammon',
	'Brown & Gammon',
	'Drumsound & Bassline Smith',
	'Drumsound&Bassline Smith',
	'W&W',
	'W & W',
	'Standard&Push',
	'Standard & Push',
	'A Girl & A Gun',
	'A Girl&A Gun',
	'Above & Beyond',
	'Above&Beyond',
	'Blonde & Craig David',
	'Blonde&Craig David',
	'DV&LM',
	'DV & LM',
	'ONE&TWO',
	'ONE & TWO',
	'C&C Music Factory',
	'C & C Music Factory',
	'Case & Point',
	'Case&Point',
	'A Boy & A Girl',
	'A Boy&A Girl',
	'X&G',
	'X & G',
	'Jack & Jack',
	'Jack&Jack',
	'Pls&Ty',
	'Pls & Ty',
	'Styles&Complete',
	'Styles & Complete',
	'Duke&Jones',
	'Duke & Jones',
	'Banx&Ranx',
	'Banx & Ranx',
	'Honey & Badger',
	'Honey&Badger',
]

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
			const remixMatch = newTitle.match(/\((.*?)(remix|mix|bootleg|edit|vip|flip)\)/i)
			if (remixMatch) {
				let remixerName = remixMatch[1].trim()
				console.log(`Found remixer "${remixerName}" in "${newTitle}"`)
				if (remixerName.includes(',,')) {
					remixerName = remixerName.split(',,').join(',')
				}

				joinWithCommaList.forEach(joinWithComma => {
					if (remixerName.includes(joinWithComma) && !skipList.includes(remixerName)) {
						remixerName = remixerName
							.split(joinWithComma)
							.join(', ')
					}
				})

				remixerSuffixList.forEach(suffix => {
					if (remixerName.includes(suffix) && !skipList.includes(remixerName)) {
						console.log({ remixerNameBefore: remixerName })
						remixerName = remixerName.split(suffix).join('')
						console.log({ remixerNameAfter: remixerName })
					}
				})

				if (remixerName.endsWith(' ')) {
					remixerName = remixerName.slice(0, -1)
				}
				if (remixerName.endsWith(' Re')) {
					console.log({ remixerNameBefore: remixerName })
					remixerName = remixerName.slice(0, -3)
					console.log({ remixerNameAfter: remixerName })
				}

				if (
					!new RegExp(`\\b${remixerName}\\b`, 'i').test(newArtist) &&
					remixerName.toLowerCase() !== 'vip' &&
					remixerName.toLowerCase() !== 're' &&
					remixerName.toLowerCase() !== 're-' &&
					remixerName.toLowerCase() !== 'dnb' &&
					remixerName.toLowerCase() !== 'drum, bass' &&
					remixerName.toLowerCase() !== 'dub' &&
					remixerName.toLowerCase() !== 'trap'
				) {
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

const directoryPath = '/Users/yahya/Music/Music'
processDirectory(directoryPath)
