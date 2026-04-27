#!/bin/bash
# Weekly Compaction Script for Wonderful Dir

WONDERFUL_DIR="/home/sefa/wonderful"
ARCHIVE_DIR="${WONDERFUL_DIR}/archive"
LOG="${WONDERFUL_DIR}/compaction.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

mkdir -p "$ARCHIVE_DIR"
echo "[${TIMESTAMP}] Starting: Weekly Compaction of Wonderful Dir..." >> "$LOG"

# Calculate the start and end dates for the *previous* full week (Monday-Sunday)
# date -d "last Sunday" gives the last Sunday's date.
END_OF_LAST_WEEK=$(date -d "last Sunday" +%Y-%m-%d)
START_OF_LAST_WEEK=$(date -d "$END_OF_LAST_WEEK - 6 days" +%Y-%m-%d)

echo "[${TIMESTAMP}] Compacting files for the week: ${START_OF_LAST_WEEK} to ${END_OF_LAST_WEEK}" >> "$LOG"

# Initialize a temporary file for the weekly summary to collect content
WEEKLY_SUMMARY_TEMP_FILE=$(mktemp)
SUMMARY_CREATED=0 # Flag to check if any content was added to the summary

# Find files created within the previous full week (Monday-Sunday)
# -newermt "DATE - 1 day" and ! -newermt "DATE + 1 day" ensures we capture files *on or between* the dates.
FILE_LIST=$(mktemp)
find "$WONDERFUL_DIR" -maxdepth 1 -type f 
    -name "*-????-??-??.*" 
    -newermt "$START_OF_LAST_WEEK - 1 day" 
    ! -newermt "$END_OF_LAST_WEEK + 1 day" > "$FILE_LIST"

if [ -s "$FILE_LIST" ]; then # Check if FILE_LIST is not empty
    SUMMARY_CREATED=1
    echo "# Weekly Report: ${START_OF_LAST_WEEK} to ${END_OF_LAST_WEEK}" >> "$WEEKLY_SUMMARY_TEMP_FILE"
    echo "" >> "$WEEKLY_SUMMARY_TEMP_FILE"

    while IFS= read -r FILE; do
        FILENAME=$(basename "$FILE")
        # Extract date from filename using Perl-compatible regex
        FILE_DATE=$(echo "$FILENAME" | grep -oP '(?<=-)\d{4}-\d{2}-\d{2}(?=\.)')

        if [[ -z "$FILE_DATE" ]]; then
            echo "[${TIMESTAMP}] Warning: Could not extract date from $FILENAME, skipping." >> "$LOG"
            continue
        fi

        echo "## ${FILENAME} (Date: ${FILE_DATE})" >> "$WEEKLY_SUMMARY_TEMP_FILE"
        echo "" >> "$WEEKLY_SUMMARY_TEMP_FILE"
        cat "$FILE" >> "$WEEKLY_SUMMARY_TEMP_FILE"
        echo "" >> "$WEEKLY_SUMMARY_TEMP_FILE"
        echo "---" >> "$WEEKLY_SUMMARY_TEMP_FILE"
        echo "" >> "$WEEKLY_SUMMARY_TEMP_FILE"

        # Move processed file to archive
        mv "$FILE" "$ARCHIVE_DIR/"
        echo "[${TIMESTAMP}] Processed and moved $FILENAME to archive." >> "$LOG"
    done < "$FILE_LIST"

    FINAL_SUMMARY_FILE="${WONDERFUL_DIR}/WEEKLY-REPORT-${END_OF_LAST_WEEK}.md"
    mv "$WEEKLY_SUMMARY_TEMP_FILE" "$FINAL_SUMMARY_FILE"
    echo "[${TIMESTAMP}] Created weekly summary: ${FINAL_SUMMARY_FILE}" >> "$LOG"
else
    echo "[${TIMESTAMP}] No files found for compaction for the week: ${START_OF_LAST_WEEK} to ${END_OF_LAST_WEEK}" >> "$LOG"
    rm "$WEEKLY_SUMMARY_TEMP_FILE" # Clean up empty temp file
fi

rm "$FILE_LIST" # Clean up temporary file list
echo "[${TIMESTAMP}] Weekly Compaction finished." >> "$LOG"
