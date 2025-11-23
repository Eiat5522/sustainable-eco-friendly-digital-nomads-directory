import type { BadgeProps, ButtonProps, InputProps, SelectProps } from '../ui';

describe('ui component types', () => {
  describe('ButtonProps interface', () => {
    it('should accept default variant button props', () => {
      const props: ButtonProps = {
        variant: 'default',
        size: 'default',
        children: 'Click me',
      };
      expect(props.variant).toBe('default');
      expect(props.size).toBe('default');
      expect(props.children).toBe('Click me');
    });

    it('should accept all variant types', () => {
      const variants: ButtonProps['variant'][] = ['default', 'outline', 'ghost', 'link'];
      variants.forEach(variant => {
        const props: ButtonProps = { variant };
        expect(props.variant).toBe(variant);
      });
    });

    it('should accept all size types', () => {
      const sizes: ButtonProps['size'][] = ['default', 'sm', 'lg'];
      sizes.forEach(size => {
        const props: ButtonProps = { size };
        expect(props.size).toBe(size);
      });
    });

    it('should accept onClick handler', () => {
      const onClick = jest.fn();
      const props: ButtonProps = { onClick };
      expect(props.onClick).toBe(onClick);
      props.onClick?.();
      expect(onClick).toHaveBeenCalled();
    });

    it('should accept className', () => {
      const props: ButtonProps = { className: 'custom-class' };
      expect(props.className).toBe('custom-class');
    });

    it('should accept all props together', () => {
      const onClick = jest.fn();
      const props: ButtonProps = {
        variant: 'outline',
        size: 'lg',
        onClick,
        className: 'test-class',
        children: 'Submit',
      };
      expect(props.variant).toBe('outline');
      expect(props.size).toBe('lg');
      expect(props.className).toBe('test-class');
      expect(props.children).toBe('Submit');
    });

    it('should accept optional props', () => {
      const props1: ButtonProps = {};
      const props2: ButtonProps = { variant: 'ghost' };
      expect(props1.variant).toBeUndefined();
      expect(props2.variant).toBe('ghost');
    });

    it('should extend button HTML attributes', () => {
      const props: ButtonProps = {
        disabled: true,
        type: 'submit',
        'aria-label': 'Submit button',
      };
      expect(props.disabled).toBe(true);
      expect(props.type).toBe('submit');
      expect(props['aria-label']).toBe('Submit button');
    });
  });

  describe('BadgeProps interface', () => {
    it('should accept default variant badge props', () => {
      const props: BadgeProps = {
        variant: 'default',
        children: 'New',
      };
      expect(props.variant).toBe('default');
      expect(props.children).toBe('New');
    });

    it('should accept all variant types', () => {
      const variants: BadgeProps['variant'][] = ['default', 'outline', 'secondary'];
      variants.forEach(variant => {
        const props: BadgeProps = { variant };
        expect(props.variant).toBe(variant);
      });
    });

    it('should accept onClick handler', () => {
      const onClick = jest.fn();
      const props: BadgeProps = { onClick };
      expect(props.onClick).toBe(onClick);
      props.onClick?.();
      expect(onClick).toHaveBeenCalled();
    });

    it('should accept className', () => {
      const props: BadgeProps = { className: 'badge-custom' };
      expect(props.className).toBe('badge-custom');
    });

    it('should accept all props together', () => {
      const onClick = jest.fn();
      const props: BadgeProps = {
        variant: 'secondary',
        onClick,
        className: 'test-badge',
        children: 'Badge Text',
      };
      expect(props.variant).toBe('secondary');
      expect(props.className).toBe('test-badge');
      expect(props.children).toBe('Badge Text');
    });

    it('should extend div HTML attributes', () => {
      const props: BadgeProps = {
        id: 'badge-1',
        'data-testid': 'test-badge',
        title: 'Badge tooltip',
      };
      expect(props.id).toBe('badge-1');
      expect(props['data-testid']).toBe('test-badge');
      expect(props.title).toBe('Badge tooltip');
    });
  });

  describe('SelectProps interface', () => {
    it('should accept valid select props with options', () => {
      const onValueChange = jest.fn();
      const props: SelectProps = {
        options: [
          { value: 'opt1', label: 'Option 1' },
          { value: 'opt2', label: 'Option 2' },
        ],
        onValueChange,
      };
      expect(props.options).toHaveLength(2);
      expect(props.onValueChange).toBe(onValueChange);
    });

    it('should accept empty options array', () => {
      const onValueChange = jest.fn();
      const props: SelectProps = {
        options: [],
        onValueChange,
      };
      expect(props.options).toHaveLength(0);
    });

    it('should accept className', () => {
      const props: SelectProps = {
        options: [],
        onValueChange: jest.fn(),
        className: 'select-custom',
      };
      expect(props.className).toBe('select-custom');
    });

    it('should call onValueChange with correct value', () => {
      const onValueChange = jest.fn();
      const props: SelectProps = {
        options: [{ value: 'test', label: 'Test' }],
        onValueChange,
      };
      props.onValueChange('test');
      expect(onValueChange).toHaveBeenCalledWith('test');
    });

    it('should extend select HTML attributes', () => {
      const props: SelectProps = {
        options: [],
        onValueChange: jest.fn(),
        disabled: true,
        name: 'select-field',
        id: 'my-select',
      };
      expect(props.disabled).toBe(true);
      expect(props.name).toBe('select-field');
      expect(props.id).toBe('my-select');
    });

    it('should handle multiple options with same structure', () => {
      const options = [
        { value: '1', label: 'First' },
        { value: '2', label: 'Second' },
        { value: '3', label: 'Third' },
        { value: '4', label: 'Fourth' },
      ];
      const props: SelectProps = {
        options,
        onValueChange: jest.fn(),
      };
      expect(props.options).toHaveLength(4);
      expect(props.options[2].label).toBe('Third');
    });
  });

  describe('InputProps interface', () => {
    it('should accept basic input props', () => {
      const props: InputProps = {
        className: 'input-custom',
      };
      expect(props.className).toBe('input-custom');
    });

    it('should accept empty props', () => {
      const props: InputProps = {};
      expect(props.className).toBeUndefined();
    });

    it('should extend input HTML attributes', () => {
      const props: InputProps = {
        type: 'text',
        placeholder: 'Enter text',
        value: 'test value',
        disabled: false,
        name: 'input-field',
        id: 'my-input',
      };
      expect(props.type).toBe('text');
      expect(props.placeholder).toBe('Enter text');
      expect(props.value).toBe('test value');
      expect(props.disabled).toBe(false);
      expect(props.name).toBe('input-field');
      expect(props.id).toBe('my-input');
    });

    it('should accept input with className and other attributes', () => {
      const props: InputProps = {
        className: 'custom-input',
        type: 'email',
        required: true,
        autoComplete: 'email',
      };
      expect(props.className).toBe('custom-input');
      expect(props.type).toBe('email');
      expect(props.required).toBe(true);
      expect(props.autoComplete).toBe('email');
    });

    it('should accept event handlers', () => {
      const onChange = jest.fn();
      const onFocus = jest.fn();
      const props: InputProps = {
        onChange,
        onFocus,
      };
      expect(props.onChange).toBe(onChange);
      expect(props.onFocus).toBe(onFocus);
    });
  });

  describe('Type integration tests', () => {
    it('should allow creating array of button props', () => {
      const buttons: ButtonProps[] = [
        { variant: 'default', children: 'Save' },
        { variant: 'outline', children: 'Cancel' },
        { variant: 'ghost', children: 'Reset' },
      ];
      expect(buttons).toHaveLength(3);
    });

    it('should allow creating array of badge props', () => {
      const badges: BadgeProps[] = [
        { variant: 'default', children: 'New' },
        { variant: 'secondary', children: 'Updated' },
      ];
      expect(badges).toHaveLength(2);
    });

    it('should handle complex select options', () => {
      const props: SelectProps = {
        options: [
          { value: 'coworking', label: 'Coworking Space' },
          { value: 'cafe', label: 'Café' },
          { value: 'accommodation', label: 'Accommodation' },
        ],
        onValueChange: value => {
          expect(['coworking', 'cafe', 'accommodation']).toContain(value);
        },
        className: 'category-select',
      };
      props.onValueChange('coworking');
    });

    it('should support conditional rendering patterns', () => {
      const getButtonProps = (isPrimary: boolean): ButtonProps => {
        return isPrimary ? { variant: 'default', size: 'lg' } : { variant: 'outline', size: 'sm' };
      };

      const primaryProps = getButtonProps(true);
      const secondaryProps = getButtonProps(false);

      expect(primaryProps.variant).toBe('default');
      expect(secondaryProps.variant).toBe('outline');
    });
  });
});
