import { EmployeeListView } from './employee';

/**
 * Legacy wrapper for the new EmployeeListView component
 * Maintains backward compatibility
 */
export function EmployeeListViewWrapper({ role, title, useStaffApi = false }: {
    role: string;
    title: string;
    useStaffApi?: boolean;
}) {
    return <EmployeeListView role={role} title={title} useStaffApi={useStaffApi} />;
}

// Export the new component as default for backward compatibility
export default EmployeeListViewWrapper;

// Export EmployeeListView for backward compatibility
export { EmployeeListView };
