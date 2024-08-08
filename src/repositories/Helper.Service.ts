const BASE_URL = process.env.API_URL;

const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${error}`);
    }
    return response.json();
}

// Function to create a new entity
async function createEntity<T>(endpoint: string, data: T): Promise<T> {
  const response = await fetch(`${BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create entity: ${response.statusText}`);
  }

  return response.json();
}

// Function to get an entity by ID
async function getEntity<T>(endpoint: string, id: string): Promise<T> {
  const response = await fetch(`${BASE_URL}/${endpoint}/${id}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch entity: ${response.statusText}`);
  }

  return response.json();
}

// Function to get all entities
async function getEntities<T>(endpoint: string): Promise<T[]> {
  const response = await fetch(`${BASE_URL}/${endpoint}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch entities: ${response.statusText}`);
  }

  return response.json();
}

// Function to update an existing entity
async function updateEntity<T>(endpoint: string, id: string, data: Partial<T>): Promise<T> {
  const response = await fetch(`${BASE_URL}/${endpoint}/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update entity: ${response.statusText}`);
  }

  return response.json();
}

// Function to delete an entity by ID
async function deleteEntity(endpoint: string, id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/${endpoint}/${id}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to delete entity: ${response.statusText}`);
  }
}

export { fetchApi, createEntity, getEntity, getEntities, updateEntity, deleteEntity };