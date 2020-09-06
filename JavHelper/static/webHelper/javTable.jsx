import React, { useState, useEffect }  from 'react';
import DataTable from 'react-data-table-component';
import Spinner from 'react-bootstrap/Spinner';

import './javBrowserV2.css'
import JavMagnetButton from './javMagnetButton'


const JavTable = ({ car, magnet_site, stat, setJavStat }) => {
  const [jav_data, setJavData] = useState([]);

  const addDownloadButton = (obj_list, car) => {
    var row;
    for (row of obj_list) {
      if (row.idmm !== undefined) {
        row['action'] = <JavMagnetButton car={car} 
          download_link={row.idmm}
          setJavStat={setJavStat}
          type='iframe'
        />;
      } else {
        row['action'] = <JavMagnetButton car={car} 
          download_link={row['magnet'] || row['web_link']}
          setJavStat={setJavStat}
        />;
      }
      
    }
    return obj_list
  }

  // when site or stat changes, pull new data
  useEffect(() => {
    if (stat === 0) {
      setJavData([]);  // set to empty to show spinner
      fetch(`/parse_jav/search_magnet_link?car=`+String(car)+`&source=`+magnet_site)
        .then(response => response.json())
        .then((jsonData) => {
          //console.log(jsonData);
          if (jsonData.success === undefined) {
            setJavData([{'title': 'not found'}]);
          } else {
            setJavData(addDownloadButton(jsonData.success, car));
          }
        })
    } else {
      setJavData([{'title': 'no magnet search'}]);
    }
  }, [magnet_site, stat])

  let header = [
    {name:"action", selector:"action", maxWidth: "15%"},
    {name:"title", selector:"title", maxWidth: "70%", wrap: true},
    {name:"size", selector:"size", maxWidth: "15%"}
  ];

  if (stat == 0){
    return(
      <div className="magnetTable">
      <DataTable
        title="Jav List"
        columns={header}
        data={jav_data}
        dense
        noTableHead
        noHeader
        noDataComponent={<Spinner animation="border" as="span" size="lg" variant="primary" />}
      />
      </div>
    )
  } else { return `` }
};

export default JavTable;

