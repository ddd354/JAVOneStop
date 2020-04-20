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

  /*useEffect(() => {
    if (stat === 0) {
    fetch(`parse_jav/search_magnet_link?car=`+String(car)+`&source=`+magnet_site)
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
  }, []);  //emtpy array to prevent running on re-render*/

  // when site changes, pull new data
  useEffect(() => {
    if (stat === 0) {
      setJavData([]);  // set to empty to show spinner
      fetch(`parse_jav/search_magnet_link?car=`+String(car)+`&source=`+magnet_site)
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
  }, [magnet_site])

  let header = [
    {name:"action", selector:"action"},
    {name:"title", selector:"title"},
    {name:"size", selector:"size"}
  ];

  return(
    <DataTable
      title="Jav List"
      columns={header}
      data={jav_data}
      dense
      noTableHead
      noHeader
      noDataComponent={<Spinner animation="border" as="span" size="lg" variant="primary" />}
    />
)};

export default JavTable;

