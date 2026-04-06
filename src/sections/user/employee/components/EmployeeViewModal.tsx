import type { EmployeeViewModalProps } from '../types';

import { GenericViewModal } from 'src/components/generic-view-view';

import { EmployeeSpecifications } from './EmployeeSpecifications';

/**
 * Employee view modal component
 */
export function EmployeeViewModal({ 
    isOpen, 
    selectedEmployee, 
    onClose, 
    t 
}: EmployeeViewModalProps) {
    return (
        <GenericViewModal
            isOpen={isOpen}
            onClose={onClose}
            title={selectedEmployee?.full_name || 'Employee Details'}
            data={selectedEmployee}
            renderContent={(data) => data && <EmployeeSpecifications employee={data} t={t} />}
        />
    );
}
