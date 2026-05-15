import React, { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	helperText?: string;
	showPasswordToggle?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
	(
		{
			label,
			error,
			helperText,
			className,
			id,
			type,
			showPasswordToggle = true,
			...props
		},
		ref,
	) => {
		const generatedId = useId();
		const inputId = id || `input-${generatedId}`;
		const [passwordVisible, setPasswordVisible] = useState(false);
		const canTogglePassword = showPasswordToggle && type === "password";
		const inputType = canTogglePassword && passwordVisible ? "text" : type;

		return (
			<div className="space-y-1">
				{label && (
					<label
						htmlFor={inputId}
						className="block text-sm font-medium text-gray-700"
					>
						{label}
					</label>
				)}
				<div className="relative">
					<input
						ref={ref}
						id={inputId}
						type={inputType}
						className={cn(
							"block w-full px-3 py-2 border border-gray-300 rounded",
							"bg-white text-gray-900 placeholder-gray-400",
							"focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
							"transition-colors duration-150",
							"sm:text-sm",
							"hover:border-gray-400",
							canTogglePassword && "pr-10",
							error &&
								"border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50",
							className,
						)}
						{...props}
					/>
					{canTogglePassword && (
						<button
							type="button"
							onClick={() => setPasswordVisible((visible) => !visible)}
							className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-r"
							aria-label={passwordVisible ? "Hide password" : "Show password"}
							aria-pressed={passwordVisible}
						>
							{passwordVisible ? (
								<EyeOff className="h-4 w-4" />
							) : (
								<Eye className="h-4 w-4" />
							)}
						</button>
					)}
				</div>
				{error && <p className="text-sm text-red-600">{error}</p>}
				{helperText && !error && (
					<p className="text-sm text-gray-500">{helperText}</p>
				)}
			</div>
		);
	},
);

Input.displayName = "Input";
