#!/usr/bin/env bash

json="const sfx = [\n"

for f in ./sfx/*; do
	# Get the file name only
	title=$( basename "${f}" )

	# Remove the file extension
	title=$( echo "${title:0:(( ${#title} - 4 ))}" )

	# Remove the preceding four numbers and underline used for sorting
	title=$( echo "${title:5}" )

	# Replace underlines with spaces
	title=$( echo "${title//_/ }" )

	# Uppercase the first letter, lowercase the rest
	title="$(tr '[:lower:]' '[:upper:]' <<< ${title:0:1})${title:1}"

	# Generate JSON, use file md5sum as unique ID
	json="${json}{\n\t\"id\": \"$( md5sum ${f} | cut -d ' ' -f 1 )\",\n"
	json="${json}\t\"title\": \"${title}\",\n"
	json="${json}\t\"file\": \"${f}\"\n},\n"
done

# Remove the last comma from last entry
json="${json:0:(( ${#json} - 3 ))}\n];";
echo -e "${json}" >_generated_json.js

exit 0
