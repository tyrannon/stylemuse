export const formatDate = (date: any): string => {
  try {
    if (!date) return 'Never';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid date';
    return dateObj.toLocaleDateString();
  } catch (error) {
    console.warn('Invalid date formatting:', error);
    return 'Invalid date';
  }
};

export const ensureDateObject = (date: any): Date | undefined => {
  try {
    if (!date) return undefined;
    if (date instanceof Date) return date;
    const dateObj = new Date(date);
    return isNaN(dateObj.getTime()) ? undefined : dateObj;
  } catch (error) {
    console.warn('Date conversion error:', error);
    return undefined;
  }
};

export const formatDateWithTime = (date: any): string => {
  try {
    if (!date) return 'Never';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid date';
    return dateObj.toLocaleString();
  } catch (error) {
    console.warn('Invalid date formatting:', error);
    return 'Invalid date';
  }
};