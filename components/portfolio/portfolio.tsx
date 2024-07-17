// components/portfolio/projects.tsx

import React from 'react';

type Project = {
  title: string;
  description: string;
};

const Projects: React.FC<{ props: Project[] }> = ({ props }) => {
  return (
    <div>
      {props.map((project, index) => (
        <div key={index} className="bg-white p-4 rounded-lg shadow-md mb-4">
          <h2 className="text-xl font-semibold mb-2">{project.title}</h2>
          <p>{project.description}</p>
        </div>
      ))}
    </div>
  );
};

export default Projects;
