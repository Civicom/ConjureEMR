import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Pencil, X } from 'lucide-react';
import { CardDescription } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EditableFieldProps {
    label: string;
    value: string;
    icon: LucideIcon;
    onUpdate?: (value: string) => Promise<void>; // Make onUpdate optional
    editable?: boolean; // Add editable prop
    type?: 'text' | 'date' | 'select'; // Add type prop for different input types
    options?: string[]; // Add options for select type
  }
  
  export function EditableField({ 
    label, 
    value, 
    icon: Icon, 
    onUpdate, 
    editable = false, // Default to non-editable
    type = 'text',
    options = []
  }: EditableFieldProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const [isLoading, setIsLoading] = useState(false);
  
    // Only show edit UI if the field is editable and has an onUpdate handler
    const canEdit = editable && onUpdate;
  
    const handleUpdate = async () => {
      if (!onUpdate) return;
      
      try {
        setIsLoading(true);
        await onUpdate(editValue);
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to update:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    const handleCancel = () => {
      setEditValue(value);
      setIsEditing(false);
    };
  
    if (isEditing && canEdit) {
      return (
        <CardDescription className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            {label}
          </div>
          <div className="flex items-center gap-2">
            {type === 'select' ? (
              <Select
                value={editValue}
                onValueChange={setEditValue}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : type === 'date' ? (
              <Input
                type="date"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-8 w-[200px]"
                disabled={isLoading}
              />
            ) : (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-8 w-[200px]"
                disabled={isLoading}
              />
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={handleUpdate}
              disabled={isLoading}
            >
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </CardDescription>
      );
    }
  
    return (
      <CardDescription className="flex justify-between items-center min-h-[32px] group">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          {label}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-700">{value}</span>
          {canEdit && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardDescription>
    );
  }