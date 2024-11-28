/*\
title: $:/om/modules/macros/appendjournal.js
type: application/javascript
module-type: macro

Append an interstitial journal entry to a tiddler

\*/
(function () {

    /*jslint node: true, browser: true */
    /*global $tw: true */
    "use strict";
        
    /*
    Information about this macro
    */
        
    exports.name = "appendjournal";
        
    exports.params = [
        {name: "timestamp"},
        {name: "entry"},
        {name: "taskTiddler"} // Journal tiddler name
    ];
        
    /*
    Run the macro
    */
    exports.run = function(timestamp, entry, taskTiddler) {
        if (entry === "") {
            return;
        }
        var tiddler = $tw.wiki.getTiddler(extractTiddlerName(entry)),
        updateFields = {
            title: tiddler.fields.title
        };
    
        updateFields["text"] = appendEntryToLogSectionOfTiddler(
            timestamp,
            entry,
            tiddler.fields.text, 
            tiddler.fields.title, 
            taskTiddler.split('/')[4] // Split because full path to tiddler looks like '$:/todolist/ data/tasks/14th November 2023' 
        );
        
        // Store the updated text 
        $tw.wiki.addTiddler(new $tw.Tiddler($tw.wiki.getCreationFields(), tiddler, updateFields, $tw.wiki.getModificationFields()));	
                                                
    };
        
    function appendEntryToLogSectionOfTiddler(timestamp, entry, currentText, tiddlerTitle, journalTiddler) {
        
        // Find the first bullet point entry in 'Log' section of tiddler
    
        var matchResult = null;
        if (currentText != null) {
            
            matchResult = currentText.match(/([!]+[ ]*Log.*\n[^]*?)(\* .*)/);
    
            // Check if the journal entry was already added to the Log section, in which case it needs to be updated.
            var existingEntryPattern = new RegExp("(\\* \\[\\[" + journalTiddler + "\\]\\] " + timestamp + " - )(.*)")
            var matchExistingLogEntryResult = currentText.match(existingEntryPattern);
        
            // Remove the name of the tiddler we're inserting into from the entry 
            var pattern = "\\[\\[" + tiddlerTitle + ".*\\]\\] - "; 
            var entryText = entry.replace(new RegExp(pattern), '');
        
            // If entry is multi-line surround content after line one in divs 
            if (entryText.indexOf("\n") != -1) { 
                entryText = entryText.replace(/\n/," <div>\n"); 
                entryText += "\n</div>"; 
            }
        
            // Prepend entry with link to Journal tiddler. 
            var fullLogEntry = "* [[" + journalTiddler + "]] " + timestamp + " - " + entryText;
        }
        // If entry is multi-line surround content after line one in divs 
        /*
        if (fullLogEntry.indexOf("\n") != -1) { 
            fullLogEntry = fullLogEntry.replace(/\n/," <div>\n"); 
            fullLogEntry += "\n</div>"; 
        }*/
        
        // Add Log section to end of tiddler if it doesn't exist and add entry 
        if (matchResult == null) { 
            return currentText += "\n\n!! Log\n\n" + fullLogEntry + "\n ";
        }
    
        var newText = currentText;
        if (matchExistingLogEntryResult == null) {  
            // Add new entry into existing log section
            var startIndex = matchResult.index + matchResult[1].length;
    
            newText = currentText.slice(0, startIndex) + fullLogEntry + "\n " + currentText.slice(startIndex); 
        } else {
            // Update existing log entry
            var startIndex = matchExistingLogEntryResult.index + matchExistingLogEntryResult[1].length
            var endIndexOfExistingEntry = -1;
            if (matchExistingLogEntryResult[0].indexOf('<div>') > 0) {
                endIndexOfExistingEntry = matchExistingLogEntryResult.index + currentText.slice(matchExistingLogEntryResult.index).indexOf('</div>') + "</div>".length;    
            } else {
                endIndexOfExistingEntry = matchExistingLogEntryResult.index + matchExistingLogEntryResult[0].length;
            }
            newText = currentText.slice(0, startIndex) + entryText + currentText.slice(endIndexOfExistingEntry);
        }
        return newText;
    
    }
    
        
    function extractTiddlerName(entry) {
        // Extract tiddler name from [[Tiddler]] or [[Tiddler|Alias]]
        var matches = entry.matchAll(/\[\[([^|\]]*)[|]?.*?\]\]/g);
        return matches.next().value[1];
    }
        
    })();
    