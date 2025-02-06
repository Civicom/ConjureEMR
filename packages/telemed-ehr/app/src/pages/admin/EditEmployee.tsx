import { ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Breadcrumbs } from './components/Breadcrumbs';
import { AVAILABLE_ROLES } from './helpers/Constants';

let renderCount = 0;



export default function EditEmployee(): ReactElement {

    const { id: employeeIdParam } = useParams();
    const employeeId = employeeIdParam;
    const isNew = employeeId === undefined;

    ++renderCount;

    return (
        <div className="flex flex-col max-w-7xl mx-auto my-16 px-4 border-gray-500">
            <Breadcrumbs pageName="Employee Name" />
            <form className="p-4 border rounded shadow-md max-w-3xs " >
            
                <div>
                    {/* TODO: remove in production */}
                    <div>Render Count: {renderCount}</div>
                    <div>Employee ID: {employeeId}</div>
                    <div>Is New: {isNew ? 'Yes' : 'No'}</div>
                    <div>useParams: <code>{JSON.stringify(useParams(), null, 2)}</code></div>
                </div>


                <div className="mb-4">
                    <label className="block font-bold">First Name:</label>
                    <input
                        type="text"
                        placeholder="First name"
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div className="mb-4">
                    <label className="block font-bold">Last Name:</label>
                    <input
                        type="text"
                        placeholder="Middle name"
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div className="mb-4">
                    <label className="block font-bold">Last Name:</label>
                    <input
                        type="text"
                        placeholder="Last name"
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div className="mb-4">
                    <label className="block font-bold">Email:</label>
                    <input
                        type="text"
                        placeholder="Email"
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div className="mb-4">
                    <label className="block font-bold">Phone:</label>
                    <input
                        type="text"
                        placeholder="Phone"
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div className="mb-4">
                    <label className="block font-bold">Roles:</label>
                        {AVAILABLE_ROLES.map((role) => {
                            return (
                                <div key={role.value} className="flex items-center gap-4">
                                    <input type="checkbox" 
                                        className="w-5 h-5 text-blue-500 bg-gray-100 border-gray-300 rounded focus:ring-grey-400 focus:ring-2" 
                                    />
                                    <div>
                                        <label>{role.label}</label>
                                        <p className="text-gray-500">{role.hint}</p>
                                    </div>
                                </div>
                            );
                        })}
                </div>
                <div className="mb-4 flex gap-2">
                    <button type="submit" className="px-4 py-2 bg-red-500 text-white rounded">
                        Save
                    </button>
                    <Link to="/admin/employee">
                        <button className="px-4 py-2 bg-white text-red-500 border border-red-500 rounded">
                            Cancel
                        </button>
                    </Link>
                </div>
            </form>
        </div>
    );
}