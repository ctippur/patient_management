import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

function App() {
  const [patients, setPatients] = useState<Array<Schema["Patient"]["type"]>>([]);

  useEffect(() => {
    client.models.Patient.observeQuery().subscribe({
      next: (data) => setPatients([...data.items]),
    });
  }, []);

  function createPatient() {
    client.models.Patient.create({ 
      name: window.prompt("Patient name") || "",
      dob: window.prompt("Date of birth (YYYY-MM-DD)") || "",
      email: window.prompt("Email") || "",
      phone: window.prompt("Phone number") || ""
    });
  }

  return (
    <main>
      <h1>Patient Management</h1>
      <button onClick={createPatient}>+ Add Patient</button>
      <ul>
        {patients.map((patient) => (
          <li key={patient.id}>
            <strong>{patient.name}</strong> - {patient.email} - {patient.dob}
          </li>
        ))}
      </ul>
      <div>
        🥳 App successfully hosted. Try creating a new patient.
        <br />
        <a href="/dashboard.html">
          Go to Dashboard
        </a>
      </div>
    </main>
  );
}

export default App;