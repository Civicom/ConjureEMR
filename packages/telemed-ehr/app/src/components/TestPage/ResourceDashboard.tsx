import React from 'react';
import { Resource } from 'fhir/r4';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ResourceDashboardProps } from './types';
import { DashboardCard } from './DashboardCard';
import { Input } from '../ui/input';

/**
 * Generic dashboard for any resource type
 * @param resourceType - The type of resource to display
 * @param resources - The resources to display
 * @param loading - Whether the resources are loading
 * @param statistics - The statistics to display
 * @param renderResourceCard - The function to render the resource card
 * @param onPageChange - The function to change the page
 * @param currentPage - The current page
 * @param totalCount - The total count of resources
 * @param rowsPerPage - The number of rows per page
 * @param searchProps - The search props:
 * { value: string,
 * onChange: (value: string) => void,
 * placeholder: string
 * }
 * @returns
 */

export function ResourceDashboard<T extends Resource>({
  resourceType,
  resources,
  loading,
  statistics,
  renderResourceCard,
  onPageChange,
  currentPage,
  totalCount,
  rowsPerPage,
  searchProps,
}: ResourceDashboardProps<T>) {
  return (
    <Accordion
      type="single"
      defaultValue="item-1"
      collapsible
      className="bg-white p-4 rounded-md shadow-sm border-2 border-gray-300"
    >
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <h1 className="text-2xl font-bold">{resourceType}s</h1>
        </AccordionTrigger>
        <AccordionContent>
          <div className="p-4 border border-gray-300 rounded-md">
            <div className="grid grid-cols-3 gap-4 p-4">
              {statistics.map((stat, index) => (
                <DashboardCard key={index} title={stat.title}>
                  <div className="text-2xl font-bold">
                    {stat.value}
                    {stat.subtitle && <span className="text-base font-normal"> {stat.subtitle}</span>}
                  </div>
                </DashboardCard>
              ))}
            </div>

            <div className="flex justify-between items-center my-4">
              <Button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 0}>
                Previous
              </Button>
              {currentPage + 1}
              <Button onClick={() => onPageChange(currentPage + 1)}>Next</Button>
            </div>
            {searchProps && (
              <div className="mb-4 w-full">
                <Input
                  type="text"
                  value={searchProps.value}
                  onChange={(e) => searchProps.onChange(e.target.value)}
                  placeholder={searchProps.placeholder}
                  className=""
                />
              </div>
            )}

            <div className="space-y-4">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border border-gray-300 rounded-md p-4 bg-white">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : resources.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg">No {resourceType.toLowerCase()}s found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              ) : (
                resources.map((resource, index) => renderResourceCard(resource, index))
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
