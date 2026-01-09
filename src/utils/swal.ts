import Swal from 'sweetalert2';

// Success alert
export const successAlert = (title: string, text: string = '') => {
    return Swal.fire({
        title,
        text,
        icon: 'success',
        confirmButtonColor: '#e11d48', // Rose-600 color
        background: '#1e293b', // Slate-800
        color: '#f1f5f9', // Slate-50
        confirmButtonText: 'OK'
    });
};

// Error alert
export const errorAlert = (title: string, text: string = '') => {
    return Swal.fire({
        title,
        text,
        icon: 'error',
        confirmButtonColor: '#dc2626', // Red-600
        background: '#1e293b',
        color: '#f1f5f9',
        confirmButtonText: 'OK'
    });
};

// Warning alert
export const warningAlert = (title: string, text: string = '') => {
    return Swal.fire({
        title,
        text,
        icon: 'warning',
        confirmButtonColor: '#d97706', // Yellow-600
        background: '#1e293b',
        color: '#f1f5f9',
        confirmButtonText: 'OK'
    });
};

// Info alert
export const infoAlert = (title: string, text: string = '') => {
    return Swal.fire({
        title,
        text,
        icon: 'info',
        confirmButtonColor: '#0284c7', // Blue-600
        background: '#1e293b',
        color: '#f1f5f9',
        confirmButtonText: 'OK'
    });
};

// Confirmation dialog
export const confirmDialog = async (
    title: string, 
    text: string = '', 
    confirmButtonText: string = 'Yes', 
    cancelButtonText: string = 'Cancel'
) => {
    const result = await Swal.fire({
        title,
        text,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#e11d48', // Rose-600
        cancelButtonColor: '#64748b', // Slate-500
        confirmButtonText,
        cancelButtonText,
        background: '#1e293b',
        color: '#f1f5f9',
        reverseButtons: true
    });
    
    return result.isConfirmed;
};

// Custom toast notification
export const showToast = (title: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#1e293b',
        color: '#f1f5f9',
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        icon,
        title
    });
};

export default Swal;