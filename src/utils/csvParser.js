import Papa from 'papaparse';

export const loadTriviaData = async () => {
  const parseCSV = (url) => {
    return new Promise((resolve, reject) => {
      Papa.parse(url, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  };

  try {
    const part1 = await parseCSV('/data/FifaTriviaPart1 - Sheet1.csv');
    const part2 = await parseCSV('/data/FifaTriviaPart2 - Sheet1.csv');
    // Combine both arrays
    return [...part1, ...part2];
  } catch (error) {
    console.error('Error loading CSV data:', error);
    return [];
  }
};
