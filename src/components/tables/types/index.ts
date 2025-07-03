export interface ElectricityDataRow {
    hour: number;
    usage: number;
    price: number;
    cost: number;
}

export interface ElectricityDataTableProps {
    meteringPointId: string;
    date: string;
    title?: string;
}

export type SortField = 'hour' | 'usage' | 'price' | 'cost';
export type SortDirection = 'asc' | 'desc';

export interface ElectricityDataTableContentProps {
    title: string;
    date: string;
    rawData: ElectricityDataRow[];
    filteredData: ElectricityDataRow[];
    sortField: SortField;
    sortDirection: SortDirection;
    searchTerm: string;
    maxUsage: number;
    avgPrice: number;
    totalUsage: number;
    totalCost: number;
    isRefetching: boolean;
    isFetching: boolean;
    onRefetch: () => void;
    onSort: (field: SortField) => void;
    onSearchChange: (term: string) => void;
    onExportCSV: () => void;
} 