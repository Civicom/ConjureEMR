import { Resource } from 'fhir/r4';

export interface DashboardStatistic {
  title: string;
  value: string | number;
  subtitle?: string;
}

export interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchParamName: string;
}

export interface ResourceDashboardProps<T extends Resource> {
  resourceType: string;
  resources: T[];
  loading: boolean;
  statistics: DashboardStatistic[];
  renderResourceCard: (resource: T, index: number) => React.ReactNode;
  onPageChange: (page: number) => void;
  currentPage: number;
  totalCount: number;
  rowsPerPage: number;
  searchProps?: SearchProps;
}
