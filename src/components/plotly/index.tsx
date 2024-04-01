import CropFreeSharpIcon from '@mui/icons-material/CropFreeSharp';
import GestureIcon from '@mui/icons-material/Gesture';
import { Box, Button,ToggleButtonGroup, ToggleButton,CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { useSelectionContext } from '../../providers/SelectionContext';


interface DataPoint {
  id: number;
  x: number;
  y: number;
}

interface Selection {
  name: string;
  area: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  };
  selectedIds: number[];
}

interface ScatterPlotProps {
  data: any[];
  xAxisSelector: string;
  yAxisSelector: string;
  maxItems: number;
  chunkSize: number;
}

const ScatterPlot: React.FC<ScatterPlotProps> = ({
  data,
  xAxisSelector,
  yAxisSelector,
  maxItems,
  chunkSize,
}) => {
  const { addSelectedId, clearSelection } = useSelectionContext();
  const [visibleData, setVisibleData] = useState<DataPoint[]>([]);
  const [loadedItems, setLoadedItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedSquareName, setSelectedSquareName] = useState('');
  const [selectionArea, setSelectionArea] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);


  useEffect(() => {
    const initialData = data.slice(0, maxItems);
    setVisibleData(initialData);
    setLoadedItems(initialData.length);
    console.log(initialData.length)
  }, [data, maxItems]);

  const handleSelectedArea = (event: any) => {
    if (isSelecting && event && event.range) {
      console.log(event.range)
      const { x, y } = event.range;
      setSelectionArea({
        startX: x[0],
        startY: y[0],
        endX: x[1],
        endY: y[1],
      });
  
      setIsSelecting(false); 
      setIsDialogOpen(true); 
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false); 
  };

  const handleSquareNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedSquareName(event.target.value);
  };

  const handleSquareNameSubmit = () => {
    if (selectedSquareName && selectionArea) {
      const newSelection: Selection = {
        name: selectedSquareName,
        area: selectionArea,
        selectedIds: visibleData
          .filter(
            (item) =>
              item.x >= selectionArea.startX &&
              item.x <= selectionArea.endX &&
              item.y >= selectionArea.startY &&
              item.y <= selectionArea.endY
          )
          .map((item) => item.id),
      };

      setSelections((prevSelections) => [...prevSelections, newSelection]);

      setSelectionArea(null);
      setSelectedSquareName('');
    }
  };

  return (
    <Box sx={{display:'flex', flexDirection:'column', alignItems:'center', gap:'1rem'}}>
      <Box sx={{ width: 'fit-content', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Typography variant="subtitle1" sx={{ marginBottom: '0.5rem' }}>
          Ferramentas:
        </Typography>
        <ToggleButtonGroup
          value={isSelecting ? 'crop' : 'gesture'}
          exclusive
          onChange={() => setIsSelecting(!isSelecting)}
        >
        <ToggleButton value="crop" size='small'>
          <CropFreeSharpIcon />
        </ToggleButton>
        <ToggleButton value="gesture" size='small'>
          <GestureIcon />
        </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box >
        {visibleData.length ? (
          <Plot
            data={[
              {
                type: 'scatter',
                mode: 'markers',
                x: visibleData.map((item) => item.x),
                y: visibleData.map((item) => item.y),
                marker: { color: 'black', size: 1 },
              },
            ]}
            layout={{
              dragmode: 'select',
              xaxis: { title: `${xAxisSelector.toUpperCase().replace("_", '-')}` },
              yaxis: { title: `${yAxisSelector.toUpperCase().replace("_", '-')}` },
              width:500,
              height:500,
              plot_bgcolor: '#fbffcd',
              paper_bgcolor:'#fbffcd'
            }}
            onSelected={handleSelectedArea}
          />
        ) : (
          <CircularProgress />
        )}

      </Box>
      {loading && <CircularProgress />}


      {selections.map((selection, index) => (
        <div key={index}>
          Nome: {selection.name}, Área: {JSON.stringify(selection.area)}, IDs: {selection.selectedIds.join(', ')}
        </div>
      ))}

      <Dialog open={isDialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Inserir Nome da Seleção</DialogTitle>
        <DialogContent>
          <TextField
            label="Nome da Seleção"
            value={selectedSquareName}
            onChange={handleSquareNameChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSquareNameSubmit}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {selectionArea && (
        <>
          <rect
            x={selectionArea.startX}
            y={selectionArea.startY}
            width={selectionArea.endX - selectionArea.startX}
            height={selectionArea.endY - selectionArea.startY}
            fill="rgba(255, 0, 0, 0.3)"
          />
          <div>
            <TextField
              label="Nome do Quadrado"
              value={selectedSquareName}
              onChange={handleSquareNameChange}
            />
            <Button variant="contained" onClick={handleSquareNameSubmit}>
              Salvar
            </Button>
          </div>
        </>
      )}
    </Box>
  );
};

export default ScatterPlot;
