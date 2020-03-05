import React from 'react';
import DataTable from 'react-data-table-component';

import { useTranslation } from 'react-i18next';

const FileTable = ({ header, file_data }) => {
  const { t, i18n } = useTranslation();

  return (
  <DataTable
    title={t('filetable_title')}
    columns={header}
    data={file_data}
    dense
  />
)};

export default FileTable;

