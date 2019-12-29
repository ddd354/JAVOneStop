import React from 'react';
import DataTable from 'react-data-table-component';

const FileTable = ({ header, file_data }) => (
  <DataTable
    title="File List"
    columns={header}
    data={file_data}
    dense
  />
);

export default FileTable;

