class Plan < Sequel::Model(:plans)
    many_to_one :city
    one_to_many :plan_lines
end
