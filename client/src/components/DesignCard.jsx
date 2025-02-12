import * as React from 'react';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { getComponents } from '../utils/fetchRequests';
import { convertObjToArr } from '../utils/convertBetweenObjArr';
import { useDispatch, useSelector } from 'react-redux';
import { retreveUserDesign } from '../utils/reducers/designSlice';

export default function DesignCard({ design }) {
  const dispatch = useDispatch();

  return (
    <Card sx={{ maxWidth: 345 }}>
      <CardMedia
        sx={{ height: 140 }}
        image={design.image_url}
        title={design.title}
      />
      <CardContent>
        <Typography gutterBottom variant='h5' component='div'>
          {design.title}
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          {design.created_at}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size='small'>Share</Button>
        <Button
          size='small'
          onClick={async () => {
            try {
              const components = await getComponents(design._id);
              components.forEach((item) =>
                ['props', 'styles'].forEach(
                  (key) => (item[key] = convertObjToArr(JSON.parse(item[key])))
                )
              );
              console.log(components);
              dispatch(retreveUserDesign({ ...design, components }));
            } catch (err) {
              console.log('error: ' + err);
            }
          }}
        >
          View design
        </Button>
      </CardActions>
    </Card>
  );
}
