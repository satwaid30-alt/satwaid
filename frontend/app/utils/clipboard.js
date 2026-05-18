/**
 * Safely copy text to clipboard with fallback for older browsers or insecure contexts.
 * @param {string} text - The text to copy.
 * @returns {Promise<boolean>} - Returns true if successful, false otherwise.
 */
export const copyToClipboard = async (text) => {
    if (!text) return false;

    // Try modern Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Clipboard API failed:', err);
        }
    }

    // Fallback to execCommand('copy')
    try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        
        // Ensure the textarea is not visible but still part of the DOM
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        textArea.style.opacity = "0";
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        return successful;
    } catch (err) {
        console.error('Fallback copy failed:', err);
        return false;
    }
};
