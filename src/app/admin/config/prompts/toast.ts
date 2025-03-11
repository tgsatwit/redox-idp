// Simple toast notification helper
export const toast = ({ title, description, variant = 'default' }: { title: string; description: string; variant?: 'default' | 'destructive' }) => {
  // In a real implementation, this would connect to a toast notification system
  // This is a simple placeholder that logs to console
  console.log(`[Toast-${variant}] ${title}: ${description}`);
  
  // Display a temporary toast message on the UI
  const toastContainer = document.createElement('div');
  toastContainer.className = `fixed top-4 right-4 z-50 max-w-md ${variant === 'destructive' ? 'bg-red-500' : 'bg-gray-800'} text-white p-4 rounded-md shadow-lg transition-all`;
  
  const titleElement = document.createElement('h4');
  titleElement.className = 'font-medium mb-1';
  titleElement.textContent = title;
  
  const descriptionElement = document.createElement('p');
  descriptionElement.className = 'text-sm text-gray-100';
  descriptionElement.textContent = description;
  
  toastContainer.appendChild(titleElement);
  toastContainer.appendChild(descriptionElement);
  
  document.body.appendChild(toastContainer);
  
  // Fade in
  setTimeout(() => {
    toastContainer.style.opacity = '1';
  }, 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toastContainer.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(toastContainer);
    }, 300);
  }, 3000);
}; 