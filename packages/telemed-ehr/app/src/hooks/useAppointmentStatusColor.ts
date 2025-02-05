const useAppointmentStatusColor = (status: string) => {
  //   returns a primary, secondary, text, and darker-primary, darker-secondary color

  const statusColor: Record<
    string,
    { primary: string; secondary: string; text: string; hoverPrimary: string; hoverSecondary: string }
  > = {
    proposed: {
      primary: 'bg-blue-500',
      secondary: 'bg-blue-200',
      text: 'text-blue-900',
      hoverPrimary: 'hover:bg-blue-700',
      hoverSecondary: 'hover:bg-blue-300',
    },
    arrived: {
      primary: 'bg-yellow-500',
      secondary: 'bg-yellow-100',
      text: 'text-yellow-900',
      hoverPrimary: 'hover:bg-yellow-700',
      hoverSecondary: 'hover:bg-yellow-300',
    },
    booked: {
      primary: 'bg-violet-500',
      secondary: 'bg-violet-50',
      text: 'text-violet-900',
      hoverPrimary: 'hover:bg-violet-700',
      hoverSecondary: 'hover:bg-violet-300',
    },
    fulfilled: {
      primary: 'bg-teal-500',
      secondary: 'bg-teal-50',
      text: 'text-teal-900',
      hoverPrimary: 'hover:bg-teal-700',
      hoverSecondary: 'hover:bg-teal-300',
    },
    cancelled: {
      primary: 'bg-red-500',
      secondary: 'bg-red-300',
      text: 'text-red-900',
      hoverPrimary: 'hover:bg-red-700',
      hoverSecondary: 'hover:bg-red-400',
    },
  };

  if (!statusColor[status]) {
    return {
      primary: 'bg-gray-500',
      secondary: 'bg-gray-100',
      text: 'text-gray-500',
      hoverPrimary: 'hover:bg-gray-700',
      hoverSecondary: 'hover:bg-gray-200',
    };
  }

  return statusColor[status];
};

export default useAppointmentStatusColor;
