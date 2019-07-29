import React, { Component } from 'react';
import { Form } from 'antd';
import { Entity } from 'aframe';
import { FormComponentProps } from 'antd/lib/form';
import debounce from 'lodash/debounce';
import { WrappedFormUtils } from 'antd/lib/form/Form';

import GeneralComponent from './GeneralComponent';
import AddComponent from './AddComponent';
import Components from './Components';
import { EntityTools } from '../../tools';
import { Empty } from '../common';
import { GeneralComponents, GeneralComponentType } from '../../constants/components/components';

type EntityType = 'entity' | 'asset';

interface IProps extends FormComponentProps {
    entity?: Entity;
    type: EntityType;
};

class Property extends Component<IProps> {
    componentWillReceiveProps(nextProps: IProps) {
        const { entity: nextEntity, form } = nextProps;
        const { entity: currentEntity } = this.props;
        if ((nextEntity && currentEntity) && (nextEntity.id !== currentEntity.id)) {
            form.resetFields();
        }
    }

    getGeneralComponents = (type: EntityType): GeneralComponentType[] => type === 'entity' ? GeneralComponents : ['name']

    renderGeneralComponent = (entity: Entity, form: WrappedFormUtils, type: EntityType, generalComponents: GeneralComponentType[]) => {
        return (
            <GeneralComponent
                entity={entity}
                form={form}
                type={type}
                generalComponents={generalComponents}
            />
        );
    }

    renderAddComponent = (entity: Entity, type: EntityType, generalComponents: GeneralComponentType[]) => {
        if (type === 'entity' || entity.tagName.toLowerCase() === 'a-mixin') {
            return (
                <AddComponent
                    entity={entity}
                    generalComponents={generalComponents}
                />
            );
        }
        return null;
    }

    renderComponents = (entity: Entity, form: WrappedFormUtils, generalComponents: GeneralComponentType[]) => {
        let type = 'entity';
        switch (entity.tagName.toLowerCase()) {
            case 'img':
                type = 'asset';
                break;
            case 'a-asset-item':
                type = 'asset';
                break;
            case 'video':
                type = 'asset';
                break;
            case 'audio':
                type = 'asset';
                break;
            default:
                type = 'entity';
                break;
        }
        return (
            <Components
                entity={entity}
                form={form}
                type={type}
                generalComponents={generalComponents}
            />
        );
    }

    render() {
        const { entity, form, type = 'entity' } = this.props;
        const generalComponents = this.getGeneralComponents(type);
        return entity ? (
            <Form style={{ display: 'flex', flexDirection: 'column' }} colon={false}>
                {this.renderGeneralComponent(entity, form, type, generalComponents)}
                {this.renderAddComponent(entity, type, generalComponents)}
                {this.renderComponents(entity, form, generalComponents)}
            </Form>
        ) : <Empty />
    }
}

const updateEntity = debounce((entity, propertyName, value) => EntityTools.updateEntity(entity, propertyName, value), 200);

export default Form.create({
    onValuesChange: (props: IProps, changedValues: any, allValues: any) => {
        const { entity } = props;
        if (entity) {
            console.log(changedValues);
            const changedComponentName = Object.keys(changedValues)[0];
            if (!entity.object3D && changedComponentName === 'src') {
                updateEntity(entity, changedComponentName, changedValues[changedComponentName]);
                return;
            }
            const { schema, isSingleProp } = AFRAME.components[changedComponentName] as any;
            if (!isSingleProp) {
                const changedSchemaKey = Object.keys(changedValues[changedComponentName])[0];
                if (schema[changedSchemaKey]) {
                    const newSchema = schema[changedSchemaKey];
                    const changedSchema = allValues[changedComponentName];
                    const value = newSchema.stringify(changedSchema[changedSchemaKey]);
                    const propertyName = `${changedComponentName}.${changedSchemaKey}`;
                    updateEntity(entity, propertyName, value);
                } else {
                    const changedSchema = allValues[changedComponentName];
                    const value = changedSchema[changedSchemaKey];
                    const propertyName = `${changedComponentName}.${changedSchemaKey}`;
                    updateEntity(entity, propertyName, value);
                }
                return;
            }
            const value = schema.stringify(allValues[changedComponentName]);
            updateEntity(entity, changedComponentName, value);
        }
    },
})(Property);
