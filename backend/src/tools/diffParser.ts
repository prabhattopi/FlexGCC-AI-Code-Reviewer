import { ParsedDiff, ParsedDiffFile, DiffHunk } from "../types.js";

/**
 * Parses unified git diff text into structured files, hunks, and line-level changes.
 */
export function parseGitDiff(diffText: string): ParsedDiff {
  const files: ParsedDiffFile[] = [];
  const lines = diffText.split(/\r?\n/);
  
  let currentFile: Partial<ParsedDiffFile> | null = null;
  let currentHunk: DiffHunk | null = null;
  let currentNewLineNum = 0;
  let currentOldLineNum = 0;
  
  let totalAdditions = 0;
  let totalDeletions = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // File header: diff --git a/path b/path
    if (line.startsWith("diff --git ")) {
      if (currentFile && currentFile.newPath) {
        if (currentHunk) currentFile.hunks!.push(currentHunk);
        files.push(currentFile as ParsedDiffFile);
      }

      const match = line.match(/^diff --git a\/(.*?) b\/(.*?)$/);
      const oldPath = match ? match[1] : "unknown";
      const newPath = match ? match[2] : "unknown";

      currentFile = {
        oldPath,
        newPath,
        isNew: false,
        isDeleted: false,
        hunks: [],
        addedLines: [],
        deletedLines: [],
      };
      currentHunk = null;
      continue;
    }

    if (!currentFile) {
      // Fallback for simple diffs starting with --- / +++
      if (line.startsWith("--- ")) {
        const oldPath = line.replace(/^---\s+(a\/)?/, "").trim();
        currentFile = {
          oldPath,
          newPath: oldPath,
          isNew: false,
          isDeleted: false,
          hunks: [],
          addedLines: [],
          deletedLines: [],
        };
      }
      continue;
    }

    // New file mode
    if (line.startsWith("new file mode ")) {
      currentFile.isNew = true;
      continue;
    }

    // Deleted file mode
    if (line.startsWith("deleted file mode ")) {
      currentFile.isDeleted = true;
      continue;
    }

    // +++ b/path
    if (line.startsWith("+++ ")) {
      const match = line.replace(/^\+\+\+\s+(b\/)?/, "").trim();
      if (match && match !== "/dev/null") {
        currentFile.newPath = match;
      }
      continue;
    }

    // --- a/path
    if (line.startsWith("--- ")) {
      const match = line.replace(/^---\s+(a\/)?/, "").trim();
      if (match && match !== "/dev/null") {
        currentFile.oldPath = match;
      }
      continue;
    }

    // Hunk header: @@ -1,5 +1,6 @@
    if (line.startsWith("@@ ")) {
      if (currentHunk) {
        currentFile.hunks!.push(currentHunk);
      }

      const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/);
      if (hunkMatch) {
        currentOldLineNum = parseInt(hunkMatch[1], 10);
        const oldLines = hunkMatch[2] ? parseInt(hunkMatch[2], 10) : 1;
        currentNewLineNum = parseInt(hunkMatch[3], 10);
        const newLines = hunkMatch[4] ? parseInt(hunkMatch[4], 10) : 1;

        currentHunk = {
          oldStart: currentOldLineNum,
          oldLines,
          newStart: currentNewLineNum,
          newLines,
          header: line,
          lines: [],
        };
      }
      continue;
    }

    // Hunk contents
    if (currentHunk) {
      currentHunk.lines.push(line);

      if (line.startsWith("+") && !line.startsWith("+++")) {
        totalAdditions++;
        currentFile.addedLines!.push({
          lineNum: currentNewLineNum,
          content: line.substring(1),
        });
        currentNewLineNum++;
      } else if (line.startsWith("-") && !line.startsWith("---")) {
        totalDeletions++;
        currentFile.deletedLines!.push({
          lineNum: currentOldLineNum,
          content: line.substring(1),
        });
        currentOldLineNum++;
      } else if (line.startsWith(" ")) {
        currentNewLineNum++;
        currentOldLineNum++;
      }
    }
  }

  if (currentFile && currentFile.newPath) {
    if (currentHunk) currentFile.hunks!.push(currentHunk);
    files.push(currentFile as ParsedDiffFile);
  }

  return {
    files,
    totalAdditions,
    totalDeletions,
  };
}
