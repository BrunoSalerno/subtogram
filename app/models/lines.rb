class Line < Sequel::Model(:lines)
    many_to_one :city
    one_to_many :sections
    one_to_many :stations

    def style
        self.city.style["line"]["opening"][self.name]
    end
end
