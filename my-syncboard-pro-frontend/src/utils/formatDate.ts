export const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    
    // Invalid date safety check
    if (isNaN(date.getTime())) return '';
  
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }); 
    // Output example: "7 Aug 2026" ya "7 Aug 0088"
  };