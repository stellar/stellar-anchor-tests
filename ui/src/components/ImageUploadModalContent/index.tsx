import React from "react";
import { useEffect, useCallback } from "react";
import styled from "styled-components";
import {
  Modal,
  Heading4,
  Eyebrow,
  Select,
  Input,
  Button,
} from "@stellar/design-system";
import { ImageFormData } from "types/config";

interface ImageModalProps {
  imageData: ImageFormData[];
  setImageData: (data: ImageFormData[]) => void;
  sep12Config: any;
}

interface ImageFormProps {
  customerNames: string[];
  imageData: ImageFormData[];
  setImageData: (data: ImageFormData[]) => void;
  index: number;
}

const ImageFormContainer = styled.div`
  margin-bottom: 1.5rem;
  margin-top: 1.5rem;
`;

const HeadingWrapper = styled.div`
  display: flex;
  position: relative;
`;

const xFormButtonStyle = {
  marginLeft: "auto",
  padding: "0rem 0.5rem",
  lineHeight: "1.56rem",
};

const xFileButtonStyle = {
  marginLeft: "auto",
  padding: "0rem 0.5rem",
  lineHeight: "1.56rem",
};

const eyebrowStyle = {
  fontSize: "1rem",
};

const UploadedFileWrapper = styled.div`
  margin: 0.5rem 0rem;
  align-items: center;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  display: flex;
  position: relative;
  border: 1px;
  border-style: ridge;
  border-color: rgba(0, 0, 0, 0.25);
  border-radius: 0.25rem;
  color: var(--pal-text-primary);
`;

const ImageUploadForm: React.FC<ImageFormProps> = ({
  customerNames,
  imageData,
  setImageData,
  index,
}) => {
  const updateImageData = useCallback(
    (updates: object) => {
      const imageDataCopy = [...imageData];
      const formDataCopy = { ...imageDataCopy[index], ...updates };
      imageDataCopy[index] = formDataCopy;
      setImageData(imageDataCopy);
    },
    [imageData, setImageData, index],
  );

  const handleFileChange = async (files: FileList | null) => {
    if (!files?.length) return;
    const buf = Buffer.from(await files[0].arrayBuffer());
    updateImageData({
      image: buf,
      fileName: files[0].name,
      fileType: files[0].type,
    });
  };

  const removeFile = (_index: number) => {
    const imageDataCopy = [...imageData];
    const formDataCopy = {
      ...imageDataCopy[index],
      image: undefined,
      fileName: undefined,
      fileType: undefined,
    };
    imageDataCopy[index] = formDataCopy;
    setImageData(imageDataCopy);
  };

  useEffect(() => {
    const updates: ImageFormData = {};
    if (!imageData[index].customerKey) updates.customerKey = customerNames[0];
    if (!imageData[index].imageType) updates.imageType = "photo_id_front";
    if (Object.keys(updates).length) updateImageData(updates);
  }, [customerNames, imageData, index, updateImageData]);

  return (
    <>
      <Select
        id="customerKey"
        label="Customer Key"
        onChange={(e) => updateImageData({ customerKey: e.target.value })}
        value={imageData[index].customerKey}
      >
        {customerNames.map((ck) => (
          <option key={ck} value={ck}>
            {ck}
          </option>
        ))}
      </Select>
      <Select
        id="imageType"
        label="Document Type"
        onChange={(e) => updateImageData({ imageType: e.target.value })}
        value={imageData[index].imageType}
      >
        <option key="photo_id_front" value="photo_id_front">
          Photo ID (front)
        </option>
        <option key="photo_id_back" value="photo_id_back">
          Photo ID (back)
        </option>
        <option
          key="notary_approval_of_photo_id"
          value="notary_approval_of_photo_id"
        >
          Notary Approval of Photo ID
        </option>
        <option key="photo_proof_residence" value="photo_proof_residence">
          Photo Proof of Residence
        </option>
      </Select>
      {!imageData[index].fileName && (
        <Input
          id="imageFile"
          type="file"
          label="Upload File"
          onChange={(e) => handleFileChange(e.target.files)}
          accept="image/*,.pdf"
        />
      )}
      {imageData[index].fileName && (
        <>
          <label>UPLOAD FILE</label>
          <UploadedFileWrapper>
            {imageData[index].fileName}
            <Button
              variant={Button.variant.secondary}
              style={xFileButtonStyle}
              onClick={() => removeFile(index)}
            >
              Remove File
            </Button>
          </UploadedFileWrapper>
        </>
      )}
    </>
  );
};

export const ImageUploadModalContent: React.FC<ImageModalProps> = ({
  imageData,
  setImageData,
  sep12Config,
}) => {
  const addImageUploadForm = useCallback(() => {
    setImageData([...imageData, {}]);
  }, [imageData, setImageData]);

  const removeForm = (index: number) => {
    const imageDataCopy = imageData
      .slice(0, index)
      .concat(imageData.slice(index + 1));
    setImageData(imageDataCopy);
  };

  useEffect(() => {
    if (!imageData.length) addImageUploadForm();
  }, [addImageUploadForm, imageData.length]);

  return (
    <>
      <Modal.Heading>Upload Customer Files</Modal.Heading>
      <Modal.Body>
        <p>
          Anchors often require files, usually images, of customer documents as
          a part of the KYC process. For example, an anchor may require a user's
          photo ID before allowing a withdrawal of funds over a certain limit.
          If your anchor does not require any images of customer records, you
          can close this window and continue testing.
        </p>
        <p>
          To associate a file with a customer, select the customer from the
          dropdown menu below, specify the type of document you would like to
          upload, and upload the file.
        </p>
        <Heading4>Customer Files</Heading4>
        {imageData.map((_, i) => {
          return (
            <ImageFormContainer key={"form-container-" + i}>
              <HeadingWrapper>
                <Eyebrow style={eyebrowStyle}>{i + 1}.</Eyebrow>
                {i !== 0 && (
                  <Button
                    variant={Button.variant.secondary}
                    style={xFormButtonStyle}
                    onClick={() => removeForm(i)}
                  >
                    Remove Form
                  </Button>
                )}
              </HeadingWrapper>
              <ImageUploadForm
                customerNames={Object.keys(sep12Config.customers)}
                imageData={imageData}
                setImageData={setImageData}
                index={i}
              />
            </ImageFormContainer>
          );
        })}
        <Button
          id="addImageUploadFormButton"
          onClick={addImageUploadForm}
          disabled={!imageData.every((i) => Boolean(i.fileName))}
        >
          Add Form
        </Button>
      </Modal.Body>
    </>
  );
};
