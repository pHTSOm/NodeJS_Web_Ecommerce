import React from 'react';
import { Card, CardBody } from 'reactstrap';

const StatsCard = ({ title, value, icon, color = 'primary' }) => {
  return (
    <Card className="mb-4 shadow-sm">
      <CardBody className="d-flex align-items-center">
        <div className={`rounded-circle bg-${color} bg-opacity-10 p-3 me-3`}>
          <i className={`${icon} fs-4 text-${color}`}></i>
        </div>
        <div>
          <h6 className="text-muted mb-1">{title}</h6>
          <h3 className="mb-0">{value}</h3>
        </div>
      </CardBody>
    </Card>
  );
};

export default StatsCard;