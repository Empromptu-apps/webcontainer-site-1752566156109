import React, { useState, useEffect } from 'react';

const QuickResearchApp = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [apiLogs, setApiLogs] = useState([]);
  const [showRawData, setShowRawData] = useState(false);
  const [rawData, setRawData] = useState(null);
  const [createdObjects, setCreatedObjects] = useState([]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const logApiCall = (method, url, data, response) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      method,
      url,
      data,
      response,
      id: Date.now()
    };
    setApiLogs(prev => [logEntry, ...prev]);
  };

  const handleResearch = async () => {
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    setLoading(true);
    setError('');
    setAnswer('');
    setRawData(null);

    const objectName = `research_${Date.now()}`;
    setCreatedObjects(prev => [...prev, objectName]);

    try {
      const requestData = {
        created_object_name: objectName,
        goal: `Research and provide a concise, authoritative paragraph summary answering this question: ${question}`
      };

      const researchResponse = await fetch('https://builder.impromptu-labs.com/api_tools/rapid_research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 4e31d5e989125dc49a09d234c59e85bc',
          'X-Generated-App-ID': '8bba8575-f980-45cc-b6fc-d2bebf7f0bdc'
        },
        body: JSON.stringify(requestData)
      });

      const researchResult = await researchResponse.json();
      logApiCall('POST', '/rapid_research', requestData, researchResult);

      if (!researchResponse.ok) {
        throw new Error(`Research request failed: ${researchResult.message || 'Unknown error'}`);
      }

      // Wait for processing, then retrieve results
      setTimeout(async () => {
        try {
          const dataResponse = await fetch(`https://builder.impromptu-labs.com/api_tools/return_data/${objectName}`, {
            method: 'GET',
            headers: {
              'Authorization': 'Bearer 4e31d5e989125dc49a09d234c59e85bc',
              'X-Generated-App-ID': '8bba8575-f980-45cc-b6fc-d2bebf7f0bdc'
            }
          });

          const result = await dataResponse.json();
          logApiCall('GET', `/return_data/${objectName}`, null, result);

          if (dataResponse.ok) {
            setAnswer(result.text_value || 'No results found');
            setRawData(result);
          } else {
            setError('Failed to retrieve research results');
          }
        } catch (err) {
          setError('Error retrieving results: ' + err.message);
        } finally {
          setLoading(false);
        }
      }, 3000);

    } catch (err) {
      setError('Research failed: ' + err.message);
      setLoading(false);
    }
  };

  const deleteObjects = async () => {
    for (const objectName of createdObjects) {
      try {
        const response = await fetch(`https://builder.impromptu-labs.com/api_tools/objects/${objectName}`, {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer 4e31d5e989125dc49a09d234c59e85bc',
            'X-Generated-App-ID': '8bba8575-f980-45cc-b6fc-d2bebf7f0bdc'
          }
        });
        const result = await response.json();
        logApiCall('DELETE', `/objects/${objectName}`, null, result);
      } catch (err) {
        console.error(`Failed to delete ${objectName}:`, err);
      }
    }
    setCreatedObjects([]);
    setAnswer('');
    setRawData(null);
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Quick Research Assistant
          </h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Column */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Ask Your Question
              </h2>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter your question about current events or technical topics..."
                className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                aria-label="Research question input"
              />
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {question.length} characters
                </span>
                <button
                  onClick={handleResearch}
                  disabled={loading || !question.trim()}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium rounded-xl transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed"
                  aria-label="Start research"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Researching...</span>
                    </div>
                  ) : (
                    'Get Answer'
                  )}
                </button>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowRawData(!showRawData)}
                disabled={!rawData}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {showRawData ? 'Hide' : 'Show'} Raw Data
              </button>
              <button
                onClick={deleteObjects}
                disabled={createdObjects.length === 0}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                Delete Objects
              </button>
            </div>
          </div>

          {/* Results Column */}
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <div className="flex items-center">
                  <span className="text-red-600 dark:text-red-400 font-medium">Error:</span>
                  <span className="ml-2 text-red-700 dark:text-red-300">{error}</span>
                </div>
              </div>
            )}

            {answer && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Research Results
                </h3>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {answer}
                  </p>
                </div>
              </div>
            )}

            {showRawData && rawData && (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Raw API Response:</h4>
                <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-auto">
                  {JSON.stringify(rawData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* API Logs */}
        {apiLogs.length > 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              API Call Logs
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {apiLogs.map((log) => (
                <div key={log.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-primary-600 dark:text-primary-400">
                      {log.method} {log.url}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {log.data && (
                    <div className="mb-2">
                      <strong className="text-gray-700 dark:text-gray-300">Request:</strong>
                      <pre className="text-xs text-gray-600 dark:text-gray-400 mt-1 overflow-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  <div>
                    <strong className="text-gray-700 dark:text-gray-300">Response:</strong>
                    <pre className="text-xs text-gray-600 dark:text-gray-400 mt-1 overflow-auto">
                      {JSON.stringify(log.response, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickResearchApp;
