import { cn } from "@/lib/utils";
import { FC } from "react";

type TabBoxProps = {
    title?: string;
    icon?: string;
    children: React.ReactNode;
    className?: string;
};

export const AppointmentTab: FC<TabBoxProps> = ({ title, icon, children, className }) => {
    return (
        <div className={cn("bg-white rounded-lg border border-gray-300", className)}>
            { title && <div>
                <div className="text-lg bg-gray-100 rounded-lg px-4 py-3 flex items-center gap-2">{icon} {title}</div>
            </div> }
            <div className="p-4">{children}</div>
        </div>
    );
}