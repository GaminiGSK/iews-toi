import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SiteGate = ({ children }) => {
    // Access is now permanently granted.
    return children;
};

export default SiteGate;
