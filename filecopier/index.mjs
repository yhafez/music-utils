import fs from 'fs'
import path from 'path'
import * as mm from 'music-metadata'

const sourceDir = '/Volumes/DJ 2/Music'
const targetDir = '/Users/yhafez/Desktop/Songs to adjust'

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
	console.log(`Creating target directory at ${targetDir}...`)
	fs.mkdirSync(targetDir)
} else {
	console.log(`Target directory ${targetDir} already exists.`)
}

// Read the files from source directory
console.log(`Reading files from ${sourceDir}...`)
fs.readdir(sourceDir, (err, files) => {
	if (err) {
		return console.error(`Error reading directory: ${err.message}`)
	}

	console.log(`Found ${files.length} files in ${sourceDir}.`)
	files.forEach(file => {
		const fullPath = path.join(sourceDir, file)

		console.log(`Reading metadata for file ${file}...`)
		// Read metadata from the music file
		mm.parseFile(fullPath)
			.then(metadata => {
				const title = metadata.common.title

				// Using a regular expression to match the patterns
				const regex = /\(.*? (remix|bootleg|edit|mix)\)/i

				if (title && regex.test(title)) {
					console.log(`File ${file} has title "${title}" that matches the condition.`)
					const targetPath = path.join(targetDir, file)

					// Copy the file to the target directory
					console.log(`Copying ${file} to ${targetPath}...`)
					fs.copyFile(fullPath, targetPath, err => {
						if (err) {
							return console.error(
								`Error copying file ${file} to ${targetPath}: ${err.message}`,
							)
						}

						console.log(
							`Successfully copied ${file} to ${targetPath}`,
						)
					})
				} else {
					console.log(
						`File ${file} does not match the condition or does not have metadata.`,
					)
				}
			})
			.catch(err => {
				console.error(`Error reading metadata for file ${file}: ${err.message}`)
			})
	})
})
