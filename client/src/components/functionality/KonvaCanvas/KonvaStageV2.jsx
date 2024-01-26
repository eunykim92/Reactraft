import React, { Fragment, createRef, useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Image, Transformer } from 'react-konva';
import useImage from 'use-image';
import { useDispatch, useSelector } from 'react-redux';
import { updateComponentRectanglePosition } from '../../../utils/reducers/designSliceV3';
import { setSelectedIdx } from '../../../utils/reducers/appSlice';

export default function KonvaStage({
  userImage,
  canvasRootRatio,
  canvasHeight,
  canvasWidth,
}) {
  const [image] = useImage(userImage);

  const { selectedIdx, selectedPageIdx } = useSelector((state) => state.app);
  // const canvasHeight = ((windowHeight - 180) * zoom) / 100;

  // redux state
  const { isDraggable, cursorMode, pages } = useSelector(
    (state) => state.designV3
  );
  const components = pages[selectedPageIdx].components;
  const rectangles = components.map((item) => item.rectangle);

  console.log('rectangles are', rectangles);

  console.log('canvasHeight, canvasWidth', canvasHeight, canvasWidth);
  const dispatch = useDispatch();

  // refs and other state
  // creating a ref object. object has a property called '.current' and the value of this property is persisted across renders. it will reference a konva Transformer component
  const trRef = useRef();
  const rectRefs = useRef([]);

  useEffect(() => {
    rectRefs.current = rectRefs.current.slice(0, components.length);
  }, [components]);

  useEffect(() => {
    if (selectedIdx !== null && trRef.current) {
      // Use the ref of the selected rectangle
      const selectedRectRef = rectRefs.current[selectedIdx];
      if (selectedRectRef) {
        trRef.current.nodes([selectedRectRef.current]);
        trRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedIdx, components]);

  // used to set cursor on the Konva change
  const stageStyle = {
    // using ternary operator to check if cursorMode from Redux state is 'pan'
    cursor: cursorMode === 'pan' ? 'grab' : 'default',
  };

  // event handlers
  function handleRectClick(e, componentId) {
    // prevent stage from deselecting the shape
    e.cancelBubble = true;
    const clickedIdx = components.findIndex((item) => item._id === componentId);
    console.log('clicked', clickedIdx);
    dispatch(setSelectedIdx(clickedIdx));
  }

  // handle drag and transform
  function handleChangeEnd(componentId, attrs) {
    const { x, y, width, height } = attrs;
    const body = {
      x: x / canvasRootRatio,
      y: y / canvasRootRatio,
      width: width / canvasRootRatio,
      height: height / canvasRootRatio,
      pageIdx: selectedPageIdx,
    };
    try {
      dispatch(updateComponentRectanglePosition({ componentId, body }));
    } catch (error) {
      dispatch(
        setMessage({
          severity: 'error',
          text: 'Design: update component rectangle position' + error,
        })
      );
    }
  }

  if (image) {
    return (
      <Stage
        style={stageStyle}
        width={canvasWidth}
        height={canvasHeight}
        draggable={isDraggable}
      >
        <Layer>
          <Image
            image={image}
            width={components[0].rectangle.width * canvasRootRatio}
            height={components[0].rectangle.height * canvasRootRatio}
          />
          {rectangles.map((rect, i) => {
            if (!rectRefs.current[i]) rectRefs.current[i] = createRef();
            const maxSide = Math.max(rect.width, rect.height) * canvasRootRatio;
            const cornerRadius = (rect.border_radius / 100) * maxSide;
            const { component_id } = rect;
            return (
              <Fragment key={component_id}>
                <Rect
                  ref={rectRefs.current[i]}
                  x={rect.x_position * canvasRootRatio}
                  y={rect.y_position * canvasRootRatio}
                  width={rect.width * canvasRootRatio}
                  height={rect.height * canvasRootRatio}
                  stroke={rect.stroke}
                  strokeScaleEnabled={false}
                  draggable={
                    components.findIndex((c) => c._id === component_id) > 0
                  }
                  strokeWidth={rect.border_width * canvasRootRatio}
                  onClick={(e) => handleRectClick(e, component_id)}
                  fill={rect.background_color}
                  cornerRadius={cornerRadius}
                  onDragEnd={(e) =>
                    handleChangeEnd(component_id, e.target.attrs)
                  }
                  onTransformEnd={(e) => {
                    // Get the shape
                    const shape = e.target;

                    // Calculate new size
                    const newWidth = shape.width() * shape.scaleX();
                    const newHeight = shape.height() * shape.scaleY();

                    // Update shape properties
                    shape.width(newWidth);
                    shape.height(newHeight);
                    shape.scaleX(1);
                    shape.scaleY(1);

                    // Update the state or handle the change as needed
                    handleChangeEnd(component_id, {
                      ...shape.attrs,
                      width: newWidth,
                      height: newHeight,
                    });
                  }}
                />
                {selectedIdx > 0 &&
                  components[selectedIdx]._id === component_id && (
                    <Transformer ref={trRef} rotateEnabled={false} />
                  )}
              </Fragment>
            );
          })}
        </Layer>
      </Stage>
    );
  }
}
