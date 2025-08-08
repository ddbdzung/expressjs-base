// Sample file to test EditorConfig and Prettier formatting
// This file demonstrates various formatting scenarios
import { isBoolean, isNumber, isString } from '../src/core/utils/type-check.util';

// Test function with various formatting issues
function testFormatting() {
  const data = {
    name: 'test',
    age: 25,
    isActive: true,
    hobbies: ['reading', 'coding', 'gaming'],
    address: {
      street: '123 Main St',
      city: 'Test City',
      country: 'Test Country',
    },
  };

  // Test conditional formatting
  if (data.age > 18) {
    console.log('Adult');
  } else {
    console.log('Minor');
  }

  // Test array and object formatting
  const numbers = [1, 2, 3, 4, 5];
  const filtered = numbers.filter(n => n > 2).map(n => n * 2);

  // Test function calls with long parameters
  const result = someVeryLongFunctionName(
    'parameter1',
    'parameter2',
    'parameter3',
    { key: 'value' }
  );

  return {
    data,
    filtered,
    result,
  };
}

// Test class formatting
class SampleClass {
  constructor(name) {
    this.name = name;
    this.createdAt = new Date();
  }

  // Test method with complex logic
  processData(input) {
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid input');
    }

    const processed = Object.keys(input).reduce((acc, key) => {
      const value = input[key];
      if (isString(value)) {
        acc[key] = value.toUpperCase();
      } else if (isNumber(value)) {
        acc[key] = value * 2;
      } else if (isBoolean(value)) {
        acc[key] = !value;
      }
      return acc;
    }, {});

    return processed;
  }

  // Test async method
  async fetchData(url) {
    try {
      const response = await fetch(url);
      const data = await response.json();
      return this.processData(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }
}

// Test arrow functions and destructuring
const processUser = ({ name, age, email }) => {
  const user = {
    name: name.trim(),
    age: parseInt(age, 10),
    email: email.toLowerCase(),
    createdAt: new Date(),
  };

  return user;
};

// Test template literals
const createGreeting = (name, age) => {
  return `Hello ${name}, you are ${age} years old!`;
};

// Test switch statement formatting
const getStatus = code => {
  switch (code) {
    case 200:
      return 'OK';
    case 404:
      return 'Not Found';
    case 500:
      return 'Internal Server Error';
    default:
      return 'Unknown';
  }
};

// Test try-catch formatting
const safeExecute = fn => {
  try {
    return fn();
  } catch (error) {
    console.error('Execution failed:', error.message);
    return null;
  } finally {
    console.log('Execution completed');
  }
};

// Export for testing
export {
  testFormatting,
  SampleClass,
  processUser,
  createGreeting,
  getStatus,
  safeExecute,
};
