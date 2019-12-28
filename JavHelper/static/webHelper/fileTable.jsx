import React from 'react';
import DataTable from 'react-data-table-component';

const columns = [
  {
    name: 'File Name',
    selector: 'file_name',
    sortable: true,
  },
  {
    name: 'Size',
    selector: 'size',
    sortable: true,
  }
];

const data = [
    {
        'file_name': 'abp-999.mp4',
        'size': '900MB'
    }
]

const FileTable = ({ file_data }) => (
  <DataTable
    title="File List"
    columns={columns}
    data={file_data}
    dense
  />
);

export default FileTable;

