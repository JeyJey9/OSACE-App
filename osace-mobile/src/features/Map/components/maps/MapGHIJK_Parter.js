import React from 'react';
import Svg, { G, Rect, Polyline, Line, Path } from 'react-native-svg';

const MapGHIJK_Parter = ({ onRoomSelect, selectedRoomId, getRoomStyle }) => {
  
  // Helper pentru a aplica stilurile rapid pe o sală
  // Dacă nu primim funcția getRoomStyle (de ex. la început), folosim default-uri
  const s = (id) => getRoomStyle ? getRoomStyle(id) : { fill: "#3953a4", opacity: 0.5, stroke: "none" };

  return (
    <Svg width={466} height={478} viewBox="0 0 466 478">
      
      {/* --- GRUPUL PEREȚI (STRUCTURA) --- */}
      <G id="Pereti">
        <Polyline points="113.43 370.75 2 370.75 2 326.4 35.96 326.4" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Polyline points="57.19 326.57 89.73 326.57 89.73 371.32" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Line x1="46.89" y1="370.75" x2="46.89" y2="327.1" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Polyline points="2.35 284.65 89.34 284.65 89.34 23.93 191.22 23.93 191.22 282.32 160.25 282.32" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Path d="M201.6,380.15v58H208" transform="translate(-61.32 -132.24)" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Line x1="140.28" y1="236.33" x2="140.28" y2="161.35" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Polyline points="140.32 75.74 140.32 151.28 89.34 151.28" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Line x1="150.45" y1="152.07" x2="191.22" y2="152.07" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Line x1="191.17" y1="88.37" x2="149.95" y2="88.37" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Line x1="139.35" y1="23.93" x2="139.35" y2="66.38" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Line x1="119.09" y1="66.38" x2="90.08" y2="66.38" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Line x1="118.56" y1="24.61" x2="118.56" y2="56.81" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Line x1="89.34" y1="236.73" x2="118.69" y2="236.73" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Polyline points="89.34 284.65 118.03 284.65 118.03 246.4" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Polyline points="160.13 305.88 191.97 305.88 191.97 282.32" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Polyline points="192.22 283.93 267.63 283.93 267.63 305.88 394.99 305.88 394.99 299.3 334.89 299.3 334.89 235.48 373.09 235.48 373.09 255.41 373.09 189.92" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Line x1="373.76" y1="213.69" x2="400.57" y2="213.69" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Polyline points="411.96 214.4 463.65 214.4 463.65 299.16 411.3 299.16 411.3 225.89" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Line x1="378.75" y1="401.39" x2="378.75" y2="453.4" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Line x1="378.75" y1="465.07" x2="295.97" y2="465.07" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Polyline points="286.99 471.75 283.45 475.29 260.36 452.19 263.28 449.27" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Polyline points="271.35 442.09 271.35 371.4 271.35 360.14" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Polyline points="271.35 369.9 191.22 369.9 191.22 327.6 208.24 327.6" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Polyline points="268.38 369.55 268.38 326.2 221.68 326.2" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Line x1="191.22" y1="215.89" x2="150.7" y2="215.89" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Line x1="120.82" y1="370.44" x2="126.06" y2="370.44" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Line x1="137.1" y1="370.26" x2="143.46" y2="370.26" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Line x1="154.5" y1="370.83" x2="158.71" y2="370.83" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Line x1="166.1" y1="370.44" x2="191.22" y2="370.44" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Path d="M234.7,508.7" transform="translate(-61.32 -132.24)" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
        <Polyline points="173.09 370.44 173.09 325.33 166.1 325.33" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
        <Line x1="159.31" y1="325.48" x2="154.08" y2="325.48" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
        <Line x1="143.46" y1="325.87" x2="137.1" y2="325.87" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
        <Line x1="126.48" y1="325.51" x2="121.25" y2="325.51" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
        <Line x1="114.03" y1="325.48" x2="89.73" y2="325.48" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
        <Line x1="177.78" y1="347.45" x2="173.53" y2="347.45" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
        <Path d="M252.54,480.21" transform="translate(-61.32 -132.24)" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
        <Line x1="184.15" y1="347.44" x2="190.73" y2="347.44" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
        <Line x1="247.86" y1="369.55" x2="247.86" y2="336.08" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
        <Line x1="281.82" y1="358.94" x2="335.59" y2="358.94" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
        <Line x1="349.53" y1="359.26" x2="358.82" y2="359.26" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
        <Line x1="366.33" y1="358.96" x2="374.51" y2="358.96" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
        <Polyline points="352.53 348.82 352.57 358.94 352.57 363.68 374.35 385.46 378 385.62 378 359.47 374.51 359.47 374.51 348.33 416.96 348.33 416.96 305.88 408.47 305.88 408.47 299.93" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Path d="M425.17,477.89" transform="translate(-61.32 -132.24)" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
        <Polyline points="373.76 349.53 364.53 340.3 364.53 317.97 385.76 317.97" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
        <Line x1="385.96" y1="348.33" x2="385.96" y2="335.06" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
        <Polyline points="404.22 348.33 404.22 327.1 385.83 327.1" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
        <Line x1="416.96" y1="317.34" x2="394.63" y2="317.34" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
        <Line x1="334.67" y1="266.05" x2="373.76" y2="266.05" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Polyline points="372.58 192.12 283.2 192.12 283.2 108.32 372.26 108.32 372.26 66.64 335.55 66.64 335.55 2 463.65 2 463.65 214.4" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Line x1="463.79" y1="150.44" x2="411.96" y2="150.44" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Line x1="411.96" y1="171.95" x2="411.96" y2="193.17" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Polyline points="372.8 178.4 372.8 122.42 297.29 122.42 297.29 178.51 373.76 178.51" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Line x1="373.09" y1="150.58" x2="401.39" y2="150.58" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Line x1="411.96" y1="129.49" x2="411.96" y2="108.27" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Line x1="372.47" y1="87.17" x2="401.26" y2="87.17" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Line x1="411.96" y1="87.04" x2="463.7" y2="87.04" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Line x1="410.81" y1="2.31" x2="410.81" y2="75.72" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Line x1="372.26" y1="66.64" x2="372.26" y2="44.79" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Line x1="373.76" y1="33.98" x2="335.76" y2="33.98" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"/>
        <Line x1="365.76" y1="23.7" x2="342.27" y2="23.7" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="8"/>
        <Path d="M203.05,480.57" transform="translate(-61.32 -132.24)" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="8"/>
        <Polyline points="310.08 358.73 310.08 348.82 331.35 348.82 331.35 358.94" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="8"/>
        <Path d="M150.66,438.62" transform="translate(-61.32 -132.24)" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="8"/>
      </G>
      
      {/* --- GRUPUL SĂLI (INTERACTIVE) --- */}
      <G id="Sali">
        {/* GD 02 */}
        <G onPress={() => onRoomSelect('room_gd02')}>
            <Rect x="4.48" y="327.1" width="41.74" height="42.24" {...s('room_gd02')} />
        </G>

        {/* GD 03 */}
        <G onPress={() => onRoomSelect('room_gd03')}>
            <Rect x="47.9" y="326.93" width="41.47" height="42.62" {...s('room_gd03')} />
        </G>

        {/* ID 03 */}
        <G onPress={() => onRoomSelect('room_id03')}>
             <Rect x="192.31" y="328.87" width="53.6" height="40.03" {...s('room_id03')} />
        </G>

        {/* AULA */}
        <G onPress={() => onRoomSelect('room_aula_belea')}>
            <Polyline points="275.02 364.48 275.63 434.79 303.69 462.85 373.76 462.85 373.76 389.37 346.54 362.15" {...s('room_aula_belea')} />
        </G>
      </G>
    </Svg>
  );
};

export default MapGHIJK_Parter;