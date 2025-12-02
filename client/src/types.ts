export interface Template {
    id: number;
    name: string;
    image_path: string;
    layout_type: 'single' | 'strip_3' | 'grid_4';
    config_json: any;
    created_at: string;
}
