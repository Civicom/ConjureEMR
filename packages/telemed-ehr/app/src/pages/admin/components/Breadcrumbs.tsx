import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
  } from '@/components/ui/breadcrumb';
  
  export function Breadcrumbs({ pageName }: { pageName: string | undefined }) {

    const pathElements = location.pathname.split('/').filter(Boolean);

    return (
        <div className="px-2">
            <Breadcrumb className="px-2">
                <BreadcrumbList>{
                    pathElements.map((element : string, index : number) => {
                        const isLast = index === pathElements.length - 1;
                        const link = '/' + pathElements.slice(0, index + 1).join('/');
                        const elementName = isLast ? pageName || element : element.charAt(0).toUpperCase() + element.slice(1);
                        return (<>
                            {index > 0 && <BreadcrumbSeparator />}
                            <BreadcrumbItem key={index}>
                                {isLast ? (
                                    <BreadcrumbPage>{elementName}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink href={link}>{elementName}</BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                        </>)
                    })
                }
                </BreadcrumbList>
            </Breadcrumb>
        </div>
    );
  }
  