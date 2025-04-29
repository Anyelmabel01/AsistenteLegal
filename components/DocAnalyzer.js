import React, { useState, useRef } from 'react';
import { Button, Upload, message, Typography, Card, Spin, Select } from 'antd';
import { UploadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { analyzeDocument } from '../utils/perplexity'; // Cambiado a perplexity
import styles from '../styles/DocAnalyzer.module.css';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const DocAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [docType, setDocType] = useState('jurisprudencia');
  const [result, setResult] = useState(null);
  const resultRef = useRef(null);

  const handleDocTypeChange = (value) => {
    setDocType(value);
  };

  const handleFileChange = (info) => {
    if (info.file.status === 'done') {
      setFile(info.file.originFileObj);
      message.success(`${info.file.name} se ha subido correctamente.`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} falló al subirse.`);
    }
  };

  const handleFileUpload = ({ file, onSuccess, onError }) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };

  const handleAnalyze = async () => {
    if (!file) {
      message.warning('Por favor, sube un documento primero.');
      return;
    }

    setAnalyzing(true);
    setResult(null);

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const text = e.target.result;
        try {
          const analysis = await analyzeDocument(text, docType);
          setResult(analysis);
          // Scroll to result after it's rendered
          setTimeout(() => {
            resultRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        } catch (error) {
          console.error('Error al analizar el documento:', error);
          message.error('Error al analizar el documento. Por favor, intenta de nuevo.');
        } finally {
          setAnalyzing(false);
        }
      };
      
      reader.onerror = () => {
        message.error('Error al leer el documento.');
        setAnalyzing(false);
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Error en el proceso de análisis:', error);
      message.error('Ocurrió un error. Por favor, intenta de nuevo.');
      setAnalyzing(false);
    }
  };

  const formatResult = (text) => {
    if (!text) return '';
    
    // Convertir saltos de línea en elementos JSX
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className={styles.analyzerContainer}>
      <Card className={styles.uploadCard}>
        <Title level={3}>Análisis de Documentos Legales</Title>
        <Paragraph>
          Sube un documento legal para recibir un análisis detallado de su contenido.
        </Paragraph>
        
        <div className={styles.inputSection}>
          <div className={styles.selectWrapper}>
            <Text strong>Tipo de documento:</Text>
            <Select 
              defaultValue="jurisprudencia"
              style={{ width: '100%' }}
              onChange={handleDocTypeChange}
              className={styles.docTypeSelect}
            >
              <Option value="jurisprudencia">Jurisprudencia</Option>
              <Option value="ley">Ley o normativa</Option>
              <Option value="contrato">Contrato</Option>
              <Option value="demanda">Demanda</Option>
            </Select>
          </div>
          
          <Upload
            customRequest={handleFileUpload}
            onChange={handleFileChange}
            maxCount={1}
            accept=".txt,.pdf,.doc,.docx"
            showUploadList={{ showRemoveIcon: true }}
            className={styles.uploader}
          >
            <Button 
              icon={<UploadOutlined />} 
              disabled={analyzing}
              className={styles.uploadButton}
            >
              Seleccionar documento
            </Button>
          </Upload>
        </div>
        
        <Button 
          type="primary" 
          onClick={handleAnalyze} 
          disabled={!file || analyzing}
          loading={analyzing}
          className={styles.analyzeButton}
        >
          {analyzing ? 'Analizando...' : 'Analizar documento'}
        </Button>
      </Card>

      {analyzing && (
        <div className={styles.loadingContainer}>
          <Spin size="large" />
          <Text className={styles.loadingText}>
            Analizando documento... Esto puede tomar algunos segundos.
          </Text>
        </div>
      )}

      {result && (
        <div ref={resultRef} className={styles.resultContainer}>
          <Card className={styles.resultCard}>
            <div className={styles.resultHeader}>
              <CheckCircleOutlined className={styles.successIcon} />
              <Title level={4}>Análisis completado</Title>
            </div>
            
            <div className={styles.resultContent}>
              {formatResult(result)}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DocAnalyzer; 