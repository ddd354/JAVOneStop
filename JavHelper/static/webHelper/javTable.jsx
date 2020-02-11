import React, { useState, useEffect }  from 'react';
import DataTable from 'react-data-table-component';

import './javlibBrowser.css'
import JavMagnetButton from './javMagnetButton'

/*function addDownloadButton(obj_list, car, index, setJavStat) {
  var row;
  for (row of obj_list) {
    row['action'] = <JavMagnetButton car={car} magnet={row['magnet']} index={index} setJavStat={setJavStat}/>;
  }
  return obj_list
}*/

const JavTable = ({ car, index, stat, setJavStat }) => {
  const [jav_data, setJavData] = useState([]);
  const [_car, set_Car] = useState(car);
  const _index = index;

  const addDownloadButton = (obj_list, car, index) => {
    var row;
    for (row of obj_list) {
      row['action'] = <JavMagnetButton car={car} magnet={row['magnet']} index={index} setJavStat={setJavStat}/>;
    }
    return obj_list
  }

  useEffect(() => {
    if (stat === 0) {
    fetch(`jav_browser/search_magnet_link?car=`+String(_car))
        .then(response => response.json())
        .then((jsonData) => {
          //console.log(jsonData);
          if (jsonData.success === undefined) {
            setJavData([{'title': 'not found'}]);
          } else {
            setJavData(addDownloadButton(jsonData.success, _car, _index));
          }
        })
    } else {
      setJavData([{'title': 'no magnet search'}]);
    }
  }, []);  //emtpy array to prevent running on re-render

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
      noDataComponent={<p>loading...</p>}
    />
)};

export default JavTable;

