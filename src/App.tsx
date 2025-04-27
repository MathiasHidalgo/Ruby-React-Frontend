import React, { useState, useEffect } from 'react';

// Define the base URL for your Rails API
// IMPORTANT: Replace 'http://localhost:3000' with the actual URL of your Rails backend
const API_BASE_URL = 'http://localhost:3000';

// Main App component for the CRUD frontend
const App = () => {
    // State to hold the list of tasks
    const [tasks, setTasks] = useState([]);
    // State to manage the form input for title
    const [newTaskTitle, setNewTaskTitle] = useState('');
    // State to manage the form input for description
    const [newTaskDescription, setNewTaskDescription] = useState('');
    // State to track if we are currently editing a task
    const [editingTask, setEditingTask] = useState(null);
    // State to manage the form input for editing title
    const [editTaskTitle, setEditTaskTitle] = useState('');
    // State to manage the form input for editing description
    const [editTaskDescription, setEditTaskDescription] = useState('');
    // State to manage loading status
    const [loading, setLoading] = useState(true);
    // State to manage general error messages (like network issues)
    const [error, setError] = useState(null);
    // State to manage specific validation errors from the backend
    const [validationErrors, setValidationErrors] = useState({});
    // State to manage feedback messages (success notices)
    const [feedbackMessage, setFeedbackMessage] = useState(null);


    // useEffect hook to fetch tasks when the component mounts
    useEffect(() => {
        fetchTasks();
    }, []); // Empty dependency array means this runs once on mount

    // useEffect hook to automatically clear feedback messages after a delay
    useEffect(() => {
        if (feedbackMessage) {
            const timer = setTimeout(() => {
                setFeedbackMessage(null);
            }, 5000); // Clear message after 5 seconds (adjust as needed)
            return () => clearTimeout(timer); // Clean up the timer
        }
    }, [feedbackMessage]); // Run this effect whenever feedbackMessage changes


    // Function to fetch tasks from the Rails backend API
    const fetchTasks = async () => {
        setLoading(true);
        setError(null);
        setValidationErrors({});
        setFeedbackMessage(null); // Clear messages on fetch
        try {
            // Make a GET request to the Rails tasks index endpoint using the absolute URL
            const response = await fetch(`${API_BASE_URL}/tasks`, {
                headers: {
                    'Accept': 'application/json' // Request JSON response
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json(); // Parse the JSON response
            setTasks(data); // Update the tasks state
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setError('Failed to fetch tasks.'); // Set error state
        } finally {
            setLoading(false); // Set loading to false
        }
    };

    // Function to handle creating a new task
    const handleCreateTask = async (e) => {
        e.preventDefault(); // Prevent default form submission

        // Clear previous errors and validation errors
        setError(null);
        setValidationErrors({});
        setFeedbackMessage(null); // Clear feedback message

        if (!newTaskTitle.trim()) {
            // Basic client-side validation
            setValidationErrors({ title: ["Title cannot be empty."] });
            return;
        }

        try {
            // Make a POST request to the Rails tasks create endpoint using the absolute URL
            const response = await fetch(`${API_BASE_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // Indicate sending JSON
                    'Accept': 'application/json', // Expect JSON response
                    // You might need to include CSRF token here depending on your Rails setup
                    // For simplicity in this example, we'll assume CSRF is handled or disabled for API
                },
                body: JSON.stringify({ // Send task data as JSON
                    task: { // Rails expects parameters nested under the model name
                        title: newTaskTitle,
                        description: newTaskDescription
                    }
                })
            });

            if (!response.ok) {
                // If response status is 422 (Unprocessable Entity), it's likely validation errors
                if (response.status === 422) {
                    const errors = await response.json(); // Parse the validation errors from the response body
                    console.error('Rails validation errors:', errors); // Log the specific errors
                    setValidationErrors(errors); // Set validation errors state
                    // We don't throw an error here, as 422 is a handled response
                } else {
                    // For other HTTP errors, throw a general error
                    const errorData = await response.json().catch(() => ({ message: 'Something went wrong.' }));
                    console.error('HTTP error:', errorData);
                    throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || JSON.stringify(errorData)}`);
                }
            } else {
                 // If response is OK (e.g., 201 Created)
                const createdTask = await response.json(); // Get the created task from the response
                setTasks([...tasks, createdTask]); // Add the new task to the state
                setNewTaskTitle(''); // Clear the form inputs
                setNewTaskDescription('');
                setValidationErrors({}); // Clear validation errors on success
                setFeedbackMessage('Task was successfully created.'); // Set success message
            }

        } catch (err) {
            console.error('Error creating task:', err);
            // Set a general error message for network issues or unexpected errors
            setError(`Failed to create task: ${err.message}`);
            setValidationErrors({}); // Clear validation errors on general error
        }
    };

    // Function to handle deleting a task
    const handleDeleteTask = async (taskId) => {
        setError(null); // Clear previous errors
        setValidationErrors({}); // Clear validation errors
        setFeedbackMessage(null); // Clear feedback message
        try {
            // Make a DELETE request to the Rails tasks destroy endpoint using the absolute URL
            const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json', // Expect JSON response (optional for DELETE)
                    // CSRF token might be needed here too
                }
            });

            if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ message: 'Failed to delete task.' }));
                 console.error('Rails deletion error:', errorData); // Log error data for deletion
                 throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || JSON.stringify(errorData)}`);
            }

            // Remove the deleted task from the state
            setTasks(tasks.filter(task => task.id !== taskId));
            setFeedbackMessage('Task was successfully deleted.'); // Set success message

        } catch (err) {
            console.error('Error deleting task:', err);
            setError(`Failed to delete task: ${err.message}`); // Set error state
        }
    };

    // Function to set the form for editing a task
    const startEditing = (task) => {
        setEditingTask(task); // Set the task being edited
        setEditTaskTitle(task.title); // Populate the edit form with current data
        setEditTaskDescription(task.description);
        setError(null); // Clear errors
        setValidationErrors({}); // Clear validation errors
        setFeedbackMessage(null); // Clear feedback message
    };

    // Function to cancel editing
    const cancelEditing = () => {
        setEditingTask(null); // Clear the editing state
        setEditTaskTitle(''); // Clear the edit form inputs
        setEditTaskDescription('');
        setError(null); // Clear errors
        setValidationErrors({}); // Clear validation errors
        setFeedbackMessage(null); // Clear feedback message
    };

    // Function to handle updating a task
    const handleUpdateTask = async (e) => {
        e.preventDefault(); // Prevent default form submission

        // Clear previous errors and validation errors
        setError(null);
        setValidationErrors({});
        setFeedbackMessage(null); // Clear feedback message


        if (!editTaskTitle.trim()) {
             // Basic client-side validation
            setValidationErrors({ title: ["Title cannot be empty."] });
            return;
        }

        try {
            // Make a PATCH request to the Rails tasks update endpoint using the absolute URL
            const response = await fetch(`${API_BASE_URL}/tasks/${editingTask.id}`, {
                method: 'PATCH', // Or 'PUT', depending on your Rails routes configuration (PATCH is common)
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    // CSRF token might be needed here
                },
                body: JSON.stringify({
                     task: { // Rails expects parameters nested under the model name
                        title: editTaskTitle,
                        description: editTaskDescription
                    }
                })
            });

            if (!response.ok) {
                // If response status is 422 (Unprocessable Entity), it's likely validation errors
                if (response.status === 422) {
                    const errors = await response.json(); // Parse the validation errors from the response body
                    console.error('Rails update validation errors:', errors); // Log the specific errors
                    setValidationErrors(errors); // Set validation errors state
                    // We don't throw an error here, as 422 is a handled response
                } else {
                    // For other HTTP errors, throw a general error
                    const errorData = await response.json().catch(() => ({ message: 'Something went wrong.' }));
                    console.error('HTTP error:', errorData);
                    throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || JSON.stringify(errorData)}`);
                }
            } else {
                // If response is OK (e.g., 200 OK)
                const updatedTask = await response.json(); // Get the updated task from the response

                // Update the task in the state
                setTasks(tasks.map(task =>
                    task.id === updatedTask.id ? updatedTask : task
                ));

                cancelEditing(); // Exit editing mode
                setValidationErrors({}); // Clear validation errors on success
                setFeedbackMessage('Task was successfully updated.'); // Set success message
            }

        } catch (err) {
            console.error('Error updating task:', err);
            // Set a general error message for network issues or unexpected errors
            setError(`Failed to update task: ${err.message}`);
            setValidationErrors({}); // Clear validation errors on general error
        }
    };

    // Helper function to render validation errors for a specific field
    const renderValidationErrors = (field) => {
        if (validationErrors && validationErrors[field]) {
            return (
                <ul className="text-red-600 text-sm mt-1 list-disc list-inside">
                    {validationErrors[field].map((msg, index) => (
                        <li key={index}>{msg}</li>
                    ))}
                </ul>
            );
        }
        return null;
    };


    // Render the component UI
    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="container mx-auto p-4 max-w-2xl rounded-lg shadow-lg bg-white">
                <h1 className="text-4xl font-extrabold text-center mb-8 text-gray-900">
                    Task Manager
                </h1>

                {/* Feedback message display (Success notices) */}
                {feedbackMessage && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6" role="alert">
                        <strong className="font-bold">Success!</strong>
                        <span className="block sm:inline"> {feedbackMessage}</span>
                    </div>
                )}

                {/* General Error message display */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
                        <strong className="font-bold">Error!</strong>
                        <span className="block sm:inline"> {error}</span>
                    </div>
                )}

                {/* Form for creating or editing tasks */}
                <div className="mb-10 p-6 border border-gray-200 rounded-xl shadow-sm bg-gray-50">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">
                        {editingTask ? 'Edit Task' : 'Create New Task'}
                    </h2>
                    <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask}>
                        <div className="mb-5">
                            <label htmlFor="title" className="block text-gray-700 text-sm font-semibold mb-2">
                                Title:
                            </label>
                            <input
                                type="text"
                                id="title"
                                className={`shadow-sm appearance-none border rounded-md w-full py-2.5 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 transition duration-200 ease-in-out ${validationErrors.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`}
                                value={editingTask ? editTaskTitle : newTaskTitle}
                                onChange={(e) => editingTask ? setEditTaskTitle(e.target.value) : setNewTaskTitle(e.target.value)}
                                required
                            />
                            {renderValidationErrors('title')}
                        </div>
                        <div className="mb-6">
                            <label htmlFor="description" className="block text-gray-700 text-sm font-semibold mb-2">
                                Description:
                            </label>
                            <textarea
                                id="description"
                                className={`shadow-sm appearance-none border rounded-md w-full py-2.5 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 transition duration-200 ease-in-out h-32 resize-none ${validationErrors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`}
                                value={editingTask ? editTaskDescription : newTaskDescription}
                                onChange={(e) => editingTask ? setEditTaskDescription(e.target.value) : setNewTaskDescription(e.target.value)}
                            ></textarea>
                            {renderValidationErrors('description')}
                        </div>
                        <div className="flex items-center justify-between">
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-md focus:outline-none focus:shadow-outline-blue transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                {editingTask ? 'Update Task' : 'Add Task'}
                            </button>
                            {editingTask && (
                                <button
                                    type="button"
                                    onClick={cancelEditing}
                                    className="ml-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2.5 px-6 rounded-md focus:outline-none focus:shadow-outline-gray transition duration-300 ease-in-out transform hover:scale-105"
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Task list display */}
                <div className="mt-10">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">Tasks</h2>
                    {loading ? (
                        <p className="text-center text-gray-600 text-lg">Loading tasks...</p>
                    ) : tasks.length === 0 ? (
                        <p className="text-center text-gray-600 text-lg">No tasks available.</p>
                    ) : (
                        <ul>
                            {tasks.map(task => (
                                <li key={task.id} className="bg-white p-5 rounded-xl shadow-md mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center border border-gray-200">
                                    <div className="mb-3 sm:mb-0 sm:mr-4 flex-grow">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-1">{task.title}</h3>
                                        <p className="text-gray-700 text-base">{task.description}</p>
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => startEditing(task)}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline-yellow transition duration-300 ease-in-out transform hover:scale-105 text-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline-red transition duration-300 ease-in-out transform hover:scale-105 text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App; // Export the App component

// Note: To run this code, you would typically set up a React project
// using Create React App, Vite, or a similar tool.
// You would replace the default App component in your project's
// src/App.js (or equivalent) with this code.
// Ensure Tailwind CSS is configured in your React project.
// This code assumes your Rails backend is running and accessible
// at the configured API_BASE_URL and configured for CORS.
